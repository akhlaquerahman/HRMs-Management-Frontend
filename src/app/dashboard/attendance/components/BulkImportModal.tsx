"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileText,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Database,
  Search,
  Sparkles,
  Timer,
  Check,
  FileCheck,
  ExternalLink
} from "lucide-react";

export type ImportMode = "MIXED" | "CREATE_ONLY" | "CORRECT_ONLY";

export interface RowValidationResult {
  rowNumber: number;
  employeeId: string;
  employeeName?: string;
  department?: string;
  attendanceDate: string;
  recordId?: string | null;
  action: "CREATE" | "CORRECT" | "SKIP" | "DUPLICATE" | "INVALID";
  isValid: boolean;
  errors: string[];
  warnings: string[];
  proposedData: {
    date: string;
    punchIn?: string | null;
    punchOut?: string | null;
    status: string;
    grossHours: number;
    effectiveHours: number;
    totalBreakMinutes: number;
    shiftName?: string;
    remarks?: string;
  };
  existingData?: {
    recordId?: string;
    punchIn?: string | null;
    punchOut?: string | null;
    status: string;
    grossHours: number;
    effectiveHours: number;
    totalBreakMinutes: number;
  } | null;
}

export interface PreviewSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newRecordsCount: number;
  correctionRecordsCount: number;
  skippedCount: number;
  duplicateCount: number;
  mode: ImportMode;
  rows: RowValidationResult[];
}

export interface CommitResult {
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  results: {
    rowNumber: number;
    employeeId: string;
    date: string;
    recordId?: string;
    status: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
    message?: string;
  }[];
  googleSheetsSyncStatus: "ENQUEUED" | "SKIPPED" | "FAILED";
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const queryClient = useQueryClient();

  // Wizard Step: 1 = Template & Upload, 2 = Preview & Diff, 3 = Uploading/Progress, 4 = Results
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Configuration & Files
  const [mode, setMode] = useState<ImportMode>("MIXED");
  const [file, setFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExportingErrors, setIsExportingErrors] = useState(false);

  // Preview Data
  const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "VALID" | "ERRORS" | "NEW" | "CORRECTIONS">("ALL");
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  // Live Progress & Timing State (for Step 3)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState<number | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Commit Results
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Reset state
  const handleReset = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setStep(1);
    setFile(null);
    setMode("MIXED");
    setPreviewSummary(null);
    setCommitResult(null);
    setConfirmed(false);
    setActiveTab("ALL");
    setPreviewSearch("");
    setPreviewPage(1);
    setUploadProgress(0);
    setElapsedSeconds(0);
    setEstimatedRemaining(null);
    setCurrentStage(1);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Step 1: Download official template
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const res = await api.get("/attendance/bulk-import/template", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `HRMS_Bulk_Attendance_Template_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel template downloaded successfully.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to download attendance template.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // File selection & auto-preview
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    await runValidation(selectedFile, mode);
  };

  // Run validation against backend
  const runValidation = async (targetFile: File, selectedMode: ImportMode) => {
    try {
      setIsValidating(true);
      const formData = new FormData();
      formData.append("file", targetFile);
      formData.append("mode", selectedMode);

      const res = await api.post("/attendance/bulk-import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        setPreviewSummary(res.data.data);
        setStep(2); // Jump directly to preview page
        setConfirmed(false);
        setPreviewPage(1);
        toast.success(`Validated ${res.data.data.totalRows} attendance records successfully.`);
      } else {
        toast.error(res.data?.message || "Failed to parse attendance file.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "File validation failed. Please inspect format and rows.");
    } finally {
      setIsValidating(false);
    }
  };

  // Step 2: Export Error Report
  const handleExportErrorReport = async () => {
    if (!previewSummary) return;
    try {
      setIsExportingErrors(true);
      const invalidRows = previewSummary.rows.filter(r => !r.isValid);
      const res = await api.post(
        "/attendance/bulk-import/export-report",
        { invalidRows },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Attendance_Import_Validation_Errors_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Validation error report downloaded.");
    } catch (err: any) {
      toast.error("Failed to export error report.");
    } finally {
      setIsExportingErrors(false);
    }
  };

  // Step 2 -> Step 3: Commit Changes with Enterprise Real-time Progress & Estimation
  const handleCommit = async () => {
    if (!previewSummary || !confirmed) return;

    // Advance to Step 3: Loading / Progress Screen
    setStep(3);
    setUploadProgress(5);
    setElapsedSeconds(0);
    setCurrentStage(1);

    const rowCount = previewSummary.rows.filter(r => r.isValid && (r.action === "CREATE" || r.action === "CORRECT")).length;
    // Estimate ~0.8s per 5 records with min 2.5s
    const totalEstimatedSec = Math.max(2.5, Math.ceil(rowCount * 0.15));
    setEstimatedRemaining(totalEstimatedSec);

    const startTime = Date.now();

    // Start progress & timer animation
    progressTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);

      setUploadProgress(prev => {
        if (prev < 30) {
          setCurrentStage(1);
          return prev + 6;
        } else if (prev < 70) {
          setCurrentStage(2);
          return prev + 4;
        } else if (prev < 92) {
          setCurrentStage(3);
          return prev + 2;
        } else {
          setCurrentStage(4);
          return 94; // Hold at 94% until API returns
        }
      });

      const remaining = Math.max(0.5, totalEstimatedSec - elapsed);
      setEstimatedRemaining(remaining);
    }, 250);

    try {
      const res = await api.post("/attendance/bulk-import/confirm", {
        rows: previewSummary.rows,
        mode
      });

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      if (res.data?.success) {
        // Smoothly reach 100%
        setUploadProgress(100);
        setCurrentStage(4);
        setEstimatedRemaining(0);
        setCommitResult(res.data.data);

        // Transition to results step
        setTimeout(() => {
          setStep(4);
          toast.success("Bulk attendance import completed successfully!");
          queryClient.invalidateQueries({ queryKey: ["adminAttendanceSummary"] });
          queryClient.invalidateQueries({ queryKey: ["adminAttendanceRecords"] });
          queryClient.invalidateQueries({ queryKey: ["attendanceOpsList"] });
          queryClient.invalidateQueries({ queryKey: ["attendanceOpsSummary"] });
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        toast.error(res.data?.message || "Commit failed.");
        setStep(2);
      }
    } catch (err: any) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      toast.error(err?.response?.data?.message || "Failed to commit bulk attendance changes.");
      setStep(2);
    }
  };

  // Filter preview rows
  const filteredPreviewRows = useMemo(() => {
    if (!previewSummary) return [];
    return previewSummary.rows.filter(row => {
      if (activeTab === "VALID" && !row.isValid) return false;
      if (activeTab === "ERRORS" && row.isValid) return false;
      if (activeTab === "NEW" && row.action !== "CREATE") return false;
      if (activeTab === "CORRECTIONS" && row.action !== "CORRECT") return false;

      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase();
        const empIdMatch = row.employeeId.toLowerCase().includes(q);
        const empNameMatch = row.employeeName?.toLowerCase().includes(q);
        const dateMatch = row.attendanceDate.includes(q);
        const deptMatch = row.department?.toLowerCase().includes(q);
        return empIdMatch || empNameMatch || dateMatch || deptMatch;
      }
      return true;
    });
  }, [previewSummary, activeTab, previewSearch]);

  const pageSize = 8;
  const totalPreviewPages = Math.max(1, Math.ceil(filteredPreviewRows.length / pageSize));
  const paginatedPreviewRows = filteredPreviewRows.slice((previewPage - 1) * pageSize, previewPage * pageSize);

  const actionableCount = useMemo(() => {
    if (!previewSummary) return 0;
    return previewSummary.rows.filter(r => r.isValid && (r.action === "CREATE" || r.action === "CORRECT")).length;
  }, [previewSummary]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl sm:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border shadow-2xl">
        {/* Header with Title and Enterprise Steps Indicator */}
        <div className="p-5 sm:p-6 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Bulk Attendance Import & Correction
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Download the official template, upload employee attendance records, inspect preview diffs, and sync with live Google Sheets.
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Wizard Progress */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { num: 1, label: "Template & Upload", desc: "View template & file" },
              { num: 2, label: "Preview & Diffs", desc: "Validate row details" },
              { num: 3, label: "Upload Progress", desc: "Live upload & timer" },
              { num: 4, label: "Import Results", desc: "Audit & sync summary" },
            ].map(s => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div
                  key={s.num}
                  className={`flex flex-col p-2.5 rounded-lg border transition-all ${
                    isActive
                      ? "bg-indigo-50 border-indigo-500/40 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-600 dark:text-indigo-300 font-semibold shadow-xs ring-1 ring-indigo-500/30"
                      : isDone
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium"
                      : "bg-muted/30 border-muted text-muted-foreground opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.num}
                      </span>
                    )}
                    <span className="truncate">{s.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/80 mt-0.5 truncate hidden sm:block">
                    {s.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* STEP 1: TEMPLATE PREVIEW & UPLOAD ("sabse pahle template show hona chahiye") */}
          {step === 1 && (
            <div className="space-y-6">
              {/* 1. Official Template Visual Showcase */}
              <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        1
                      </span>
                      <h3 className="text-sm font-bold text-foreground">
                        Official Attendance Spreadsheet Template
                      </h3>
                      <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50">
                        Required Format
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your Excel (.xlsx) or CSV file must match the following columns and format specifications:
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    disabled={isDownloadingTemplate}
                    className="gap-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-semibold shadow-xs h-9 shrink-0"
                  >
                    {isDownloadingTemplate ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span>Download Template (.xlsx)</span>
                  </Button>
                </div>

                {/* Template Table Visual Preview */}
                <div className="border rounded-lg overflow-hidden bg-muted/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-muted/70 text-muted-foreground border-b font-medium">
                        <tr>
                          <th className="py-2 px-3 font-semibold text-foreground">Employee ID</th>
                          <th className="py-2 px-3 font-semibold text-foreground">Attendance Date</th>
                          <th className="py-2 px-3 font-semibold text-foreground">Punch In</th>
                          <th className="py-2 px-3 font-semibold text-foreground">Punch Out</th>
                          <th className="py-2 px-3 font-semibold text-foreground">Lunch Break (Mins)</th>
                          <th className="py-2 px-3 font-semibold text-foreground">Status</th>
                          <th className="py-2 px-3 font-semibold text-foreground">Shift</th>
                          <th className="py-2 px-3 font-semibold text-foreground">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono text-[11px]">
                        <tr className="bg-card hover:bg-muted/30">
                          <td className="py-2 px-3 font-semibold text-primary">EMP-5277</td>
                          <td className="py-2 px-3">2026-10-10</td>
                          <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">09:00:00</td>
                          <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">18:00:00</td>
                          <td className="py-2 px-3">45</td>
                          <td className="py-2 px-3"><Badge variant="outline" className="text-[10px] font-mono">PRESENT</Badge></td>
                          <td className="py-2 px-3 font-sans text-muted-foreground">General Shift</td>
                          <td className="py-2 px-3 font-sans text-muted-foreground italic">Regular biometric session</td>
                        </tr>
                        <tr className="bg-muted/10 hover:bg-muted/30">
                          <td className="py-2 px-3 font-semibold text-primary">EMP7033743</td>
                          <td className="py-2 px-3">2026-10-10</td>
                          <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">09:30:00</td>
                          <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">13:30:00</td>
                          <td className="py-2 px-3">0</td>
                          <td className="py-2 px-3"><Badge variant="outline" className="text-[10px] font-mono text-amber-600 border-amber-300">HALF_DAY</Badge></td>
                          <td className="py-2 px-3 font-sans text-muted-foreground">Morning Shift</td>
                          <td className="py-2 px-3 font-sans text-muted-foreground italic">Approved half-day login</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Format Rules & Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                  <div className="p-2.5 rounded-lg border bg-muted/30">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Date & Time
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Date: <code className="text-primary font-mono">YYYY-MM-DD</code> &bull; Time: <code className="text-primary font-mono">HH:mm:ss</code> (24h)
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/30">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Canonical Statuses
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      PRESENT, ABSENT, HALF_DAY, ON_LEAVE, HOLIDAY, WEEK_OFF
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/30">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Overnight Shifts
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Automatically supported when Punch Out &lt; Punch In.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Mode Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    2
                  </span>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Select Import Mode
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "MIXED" as ImportMode,
                      title: "Smart Mixed Mode",
                      badge: "Recommended",
                      desc: "Inserts missing records and corrects matched existing records safely."
                    },
                    {
                      id: "CREATE_ONLY" as ImportMode,
                      title: "Create Missing Only",
                      badge: "Strict",
                      desc: "Inserts records only when none exist. Existing records will be skipped."
                    },
                    {
                      id: "CORRECT_ONLY" as ImportMode,
                      title: "Correct Existing Only",
                      badge: "Strict",
                      desc: "Updates existing attendance only. Rejects rows without a matching record."
                    }
                  ].map(m => {
                    const isSelected = mode === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500"
                            : "border-border bg-card hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-semibold text-foreground">{m.title}</span>
                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={`text-[9px] px-1.5 py-0 h-4 ${isSelected ? "bg-indigo-600" : ""}`}
                          >
                            {m.badge}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">{m.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. File Upload Area */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    3
                  </span>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Upload Your Spreadsheet
                  </label>
                </div>

                {!file ? (
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-500 rounded-xl p-8 text-center transition-all bg-indigo-50/20 dark:bg-indigo-950/20 cursor-pointer flex flex-col items-center justify-center gap-3"
                    onClick={() => document.getElementById("file-upload-input")?.click()}
                  >
                    <div className="p-3.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Click to select or drag and drop your file here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports <code className="font-mono text-primary">.xlsx</code> and <code className="font-mono text-primary">.csv</code> files up to 10MB
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-semibold mt-1 gap-1.5 pointer-events-none">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Browse Files</span>
                    </Button>
                    <Input
                      id="file-upload-input"
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border bg-card flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB &bull;{" "}
                          {file.name.endsWith(".csv") ? "CSV Document" : "Excel Workbook"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4 mr-1" /> Replace File
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => runValidation(file, mode)}
                        disabled={isValidating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
                      >
                        {isValidating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Validating...</span>
                          </>
                        ) : (
                          <>
                            <span>Inspect & Preview</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION PAGE ("aur jab file upload karde to ek preview ka page hona chahiye") */}
          {step === 2 && previewSummary && (
            <div className="space-y-4">
              {/* Header with summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg border bg-card shadow-xs">
                  <span className="text-muted-foreground block text-[10px]">Total Rows</span>
                  <span className="text-base font-bold text-foreground">{previewSummary.totalRows}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                  <span className="block text-[10px] font-medium">Valid Rows</span>
                  <span className="text-base font-bold">{previewSummary.validRows}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-destructive/10 border-destructive/30 text-destructive">
                  <span className="block text-[10px] font-medium">Errors / Invalid</span>
                  <span className="text-base font-bold">{previewSummary.invalidRows}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400">
                  <span className="block text-[10px] font-medium">New Records</span>
                  <span className="text-base font-bold">{previewSummary.newRecordsCount}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
                  <span className="block text-[10px] font-medium">Corrections</span>
                  <span className="text-base font-bold">{previewSummary.correctionRecordsCount}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300">
                  <span className="block text-[10px] font-medium">Skipped / Dups</span>
                  <span className="text-base font-bold">
                    {previewSummary.skippedCount + previewSummary.duplicateCount}
                  </span>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: "ALL", label: `All (${previewSummary.totalRows})` },
                    { id: "VALID", label: `Valid (${previewSummary.validRows})` },
                    { id: "ERRORS", label: `Errors (${previewSummary.invalidRows})` },
                    { id: "NEW", label: `New (${previewSummary.newRecordsCount})` },
                    { id: "CORRECTIONS", label: `Corrections (${previewSummary.correctionRecordsCount})` }
                  ].map(tab => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setPreviewPage(1);
                      }}
                      className="h-7 text-xs px-2.5 whitespace-nowrap"
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search rows..."
                      value={previewSearch}
                      onChange={e => {
                        setPreviewSearch(e.target.value);
                        setPreviewPage(1);
                      }}
                      className="h-7 text-xs pl-8"
                    />
                  </div>

                  {previewSummary.invalidRows > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportErrorReport}
                      disabled={isExportingErrors}
                      className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Error Report</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Paginated Preview Table */}
              <div className="border rounded-xl overflow-hidden bg-card shadow-xs">
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/60 text-muted-foreground sticky top-0 z-10 border-b">
                      <tr>
                        <th className="py-2 px-3 font-semibold w-12 text-center">Row</th>
                        <th className="py-2 px-3 font-semibold">Employee</th>
                        <th className="py-2 px-3 font-semibold">Date</th>
                        <th className="py-2 px-3 font-semibold">Punch In / Out</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold">Action</th>
                        <th className="py-2 px-3 font-semibold">Validation Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            No attendance rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        paginatedPreviewRows.map(row => {
                          const isInvalid = !row.isValid;
                          const isCorrect = row.action === "CORRECT";
                          const isCreate = row.action === "CREATE";
                          const isSkip = row.action === "SKIP";

                          return (
                            <tr
                              key={row.rowNumber}
                              className={`hover:bg-muted/30 transition-colors ${
                                isInvalid
                                  ? "bg-destructive/5"
                                  : isCorrect
                                  ? "bg-amber-500/5"
                                  : ""
                              }`}
                            >
                              <td className="py-2 px-3 font-mono text-center text-muted-foreground">
                                {row.rowNumber}
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-foreground">{row.employeeId}</div>
                                {row.employeeName && (
                                  <div className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                                    {row.employeeName}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono">{row.attendanceDate}</td>
                              <td className="py-2 px-3">
                                {row.proposedData.punchIn || row.proposedData.punchOut ? (
                                  <div className="font-mono text-[11px]">
                                    {row.proposedData.punchIn || "--:--"} &rarr;{" "}
                                    {row.proposedData.punchOut || "--:--"}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic">No punch times</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {row.proposedData.status}
                                </Badge>
                              </td>
                              <td className="py-2 px-3">
                                {isInvalid ? (
                                  <Badge variant="destructive" className="text-[10px]">
                                    INVALID
                                  </Badge>
                                ) : isCreate ? (
                                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px]">
                                    CREATE
                                  </Badge>
                                ) : isCorrect ? (
                                  <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[10px]">
                                    CORRECT
                                  </Badge>
                                ) : isSkip ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    SKIP
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">
                                    {row.action}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {row.errors.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {row.errors.map((err, ei) => (
                                      <div
                                        key={ei}
                                        className="text-[11px] text-destructive flex items-center gap-1 font-medium"
                                      >
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        <span>{err}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : isCorrect && row.existingData ? (
                                  <div className="text-[11px] text-amber-700 dark:text-amber-400 space-y-0.5">
                                    <div className="font-semibold flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" /> Proposed Correction:
                                    </div>
                                    {row.existingData.status !== row.proposedData.status && (
                                      <div>
                                        Status:{" "}
                                        <span className="line-through text-muted-foreground">
                                          {row.existingData.status}
                                        </span>{" "}
                                        &rarr; <b>{row.proposedData.status}</b>
                                      </div>
                                    )}
                                    {row.existingData.punchOut !== row.proposedData.punchOut && (
                                      <div>
                                        Punch Out:{" "}
                                        <span className="line-through text-muted-foreground">
                                          {row.existingData.punchOut || "None"}
                                        </span>{" "}
                                        &rarr; <b>{row.proposedData.punchOut || "None"}</b>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Ready for import
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-2.5 border-t bg-muted/20 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    Showing {(previewPage - 1) * pageSize + 1} to{" "}
                    {Math.min(previewPage * pageSize, filteredPreviewRows.length)} of{" "}
                    {filteredPreviewRows.length} rows
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage(p => p - 1)}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="font-medium text-[11px] px-1">
                      {previewPage} / {totalPreviewPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={previewPage >= totalPreviewPages}
                      onClick={() => setPreviewPage(p => p + 1)}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Explicit Confirmation Gate */}
              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="confirm-import-checkbox"
                    checked={confirmed}
                    onCheckedChange={checked => setConfirmed(!!checked)}
                    className="mt-0.5 border-indigo-400 data-[state=checked]:bg-indigo-600"
                  />
                  <label
                    htmlFor="confirm-import-checkbox"
                    className="text-xs font-medium text-foreground leading-normal cursor-pointer"
                  >
                    I authorize committing these attendance changes to PostgreSQL. New records will be inserted, existing sessions will be corrected with audit logs, and mutations will sync to Google Sheets.
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Template / Re-upload</span>
                </Button>

                <Button
                  onClick={handleCommit}
                  disabled={!confirmed || actionableCount === 0}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white min-w-[190px] font-semibold"
                >
                  <Database className="w-4 h-4" />
                  <span>Done / Commit {actionableCount} Rows</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: LIVE UPLOAD PROGRESS WITH PERCENTAGE & TIME ESTIMATION ("loading percentage bhi show hona chahiye kitna time lagega upload hone me") */}
          {step === 3 && (
            <div className="py-8 px-4 sm:px-8 space-y-8 max-w-2xl mx-auto text-center">
              {/* Progress Icon & Title */}
              <div className="space-y-2">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border-4 border-indigo-500/20 flex items-center justify-center animate-pulse">
                    <Database className="w-9 h-9 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white shadow-md">
                    {uploadProgress}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Processing & Uploading Attendance Records...
                </h3>
                <p className="text-xs text-muted-foreground">
                  Applying transactional database updates, calculating shift durations, and preparing Google Sheets synchronization.
                </p>
              </div>

              {/* Main Progress Bar with Large Percentage Display */}
              <div className="space-y-3 bg-card p-5 rounded-xl border shadow-xs text-left">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Upload Progress</span>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm font-bold">
                    {uploadProgress}%
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="relative h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {/* Dynamic Time Estimation Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" /> Time Elapsed
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {elapsedSeconds}s
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-emerald-600" /> Est. Remaining
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {estimatedRemaining !== null ? `~${estimatedRemaining.toFixed(1)}s` : "Calculating..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Stage Live Pipeline Checklist */}
              <div className="space-y-2 text-left bg-card p-4 rounded-xl border shadow-xs text-xs">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px] block mb-2">
                  Enterprise Processing Pipeline
                </span>

                {[
                  {
                    stage: 1,
                    title: "Validating spreadsheet rows & RBAC isolation",
                    desc: "Checking employee company assignment and manager department scope."
                  },
                  {
                    stage: 2,
                    title: "Executing bounded PostgreSQL batch transactions",
                    desc: "Recalculating effective hours, overnight shifts, and breaks."
                  },
                  {
                    stage: 3,
                    title: "Recording durable audit trail & correction logs",
                    desc: "Creating immutable audit entries for tracking historical changes."
                  },
                  {
                    stage: 4,
                    title: "Enqueuing live Google Sheets synchronization",
                    desc: "Queueing durable outbox mutations for reliable spreadsheet sync."
                  }
                ].map(stepItem => {
                  const isDone = currentStage > stepItem.stage || uploadProgress === 100;
                  const isCurrent = currentStage === stepItem.stage && uploadProgress < 100;

                  return (
                    <div
                      key={stepItem.stage}
                      className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                        isCurrent
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800"
                          : ""
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        ) : isCurrent ? (
                          <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[10px] text-muted-foreground">
                            {stepItem.stage}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            isDone
                              ? "text-emerald-700 dark:text-emerald-400"
                              : isCurrent
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          {stepItem.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{stepItem.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT RESULTS & GOOGLE SHEETS AUDIT SUMMARY */}
          {step === 4 && commitResult && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border bg-card text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Bulk Import Completed Successfully</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Attendance records have been processed and stored in PostgreSQL with durable audit logs.
                  </p>
                </div>

                {/* Result KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs pt-2">
                  <div className="p-2.5 rounded-lg border bg-muted/30">
                    <span className="text-muted-foreground block text-[10px]">Total Processed</span>
                    <span className="text-base font-bold text-foreground">{commitResult.totalProcessed}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
                    <span className="block text-[10px] font-medium">Created</span>
                    <span className="text-base font-bold">{commitResult.createdCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-blue-500/10 border-blue-500/30 text-blue-600">
                    <span className="block text-[10px] font-medium">Updated / Corrected</span>
                    <span className="text-base font-bold">{commitResult.updatedCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-slate-500/10 border-slate-500/30 text-slate-600">
                    <span className="block text-[10px] font-medium">Skipped</span>
                    <span className="text-base font-bold">{commitResult.skippedCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-destructive/10 border-destructive/30 text-destructive">
                    <span className="block text-[10px] font-medium">Failed</span>
                    <span className="text-base font-bold">{commitResult.failedCount}</span>
                  </div>
                </div>

                {/* Google Sheets Live Outbox Status */}
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <b>Google Sheets Outbox Synchronization:</b> Durable sync events enqueued for all committed
                      records.
                    </span>
                  </div>
                  <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50 text-[10px]">
                    ACTIVE OUTBOX SYNC
                  </Badge>
                </div>
              </div>

              {/* Failures Table if failedCount > 0 */}
              {commitResult.failedCount > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Failed Rows Details
                  </span>

                  <div className="border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-muted/60 text-muted-foreground border-b">
                        <tr>
                          <th className="py-2 px-3">Row #</th>
                          <th className="py-2 px-3">Employee</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {commitResult.results
                          .filter(r => r.status === "FAILED")
                          .map((f, fi) => (
                            <tr key={fi} className="hover:bg-muted/20">
                              <td className="py-2 px-3 font-mono">{f.rowNumber}</td>
                              <td className="py-2 px-3 font-semibold">{f.employeeId}</td>
                              <td className="py-2 px-3 font-mono">{f.date}</td>
                              <td className="py-2 px-3 text-destructive">{f.message}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Completion Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  onClick={handleClose}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-[140px] font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Done & Refresh Attendance</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Backwards-compatibility alias
export const BulkUploadModal = BulkImportModal;
