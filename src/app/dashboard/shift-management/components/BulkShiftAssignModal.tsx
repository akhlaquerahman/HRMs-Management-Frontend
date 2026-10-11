"use client";

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/axios';
import ExcelJS from 'exceljs';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  RefreshCw, 
  FileText, 
  Layers, 
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  weeklyOff?: string[];
}

interface EmployeeRoster {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: { id: string; name: string };
  designation?: { id: string; name: string };
  shift?: { id: string; name: string };
}

interface ParsedRow {
  employeeId: string;
  email: string;
  name: string;
  department: string;
  designation: string;
  currentShift: string;
  targetShiftName: string;
  resolvedShiftId?: string | null;
  isValid: boolean;
  error?: string;
}

interface BulkShiftAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  roster: EmployeeRoster[];
  onSuccess: () => void;
}

export function BulkShiftAssignModal({
  isOpen,
  onClose,
  shifts,
  roster,
  onSuccess
}: BulkShiftAssignModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'VALID' | 'ERROR'>('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [resultSummary, setResultSummary] = useState<{ success: number; failed: number } | null>(null);

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setResultSummary(null);
    setFilterType('ALL');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (submitting) return;
    handleReset();
    onClose();
  };

  // 1. Download Pre-filled Template via Backend API or Browser ExcelJS fallback
  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const res = await api.get('/shifts/bulk-assign-template', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Bulk_Shift_Assignment_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("Shift assignment template downloaded successfully"));
    } catch (e: any) {
      console.warn("Backend template download failed, generating client-side workbook...", e);
      // Fallback: Generate via browser ExcelJS
      try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Shift_Assignment');

        sheet.columns = [
          { header: 'Employee ID', key: 'employeeId', width: 18 },
          { header: 'Full Name', key: 'name', width: 22 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Department', key: 'department', width: 22 },
          { header: 'Designation', key: 'designation', width: 22 },
          { header: 'Current Shift', key: 'currentShift', width: 22 },
          { header: 'New Shift Name (Required)', key: 'newShift', width: 28 },
        ];

        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

        roster.forEach(emp => {
          sheet.addRow({
            employeeId: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            email: emp.email,
            department: emp.department?.name || '—',
            designation: emp.designation?.name || '—',
            currentShift: emp.shift?.name || 'Unassigned',
            newShift: emp.shift?.name || ''
          });
        });

        const refSheet = workbook.addWorksheet('Available_Shifts_Reference');
        refSheet.columns = [
          { header: 'Valid Shift Name', key: 'name', width: 25 },
          { header: 'Working Hours', key: 'hours', width: 20 },
        ];
        shifts.forEach(s => {
          refSheet.addRow({
            name: s.name,
            hours: `${s.startTime} - ${s.endTime}`
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Bulk_Shift_Assignment_Template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success(t("Client template downloaded"));
      } catch (err: any) {
        toast.error("Failed to download template: " + err.message);
      }
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // 2. Parse Excel/CSV File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    await parseUploadedFile(selectedFile);
  };

  const parseUploadedFile = async (uploadedFile: File) => {
    try {
      setParsing(true);
      const shiftMap = new Map<string, Shift>();
      shifts.forEach(s => {
        shiftMap.set(s.name.trim().toLowerCase(), s);
      });

      const empCodeMap = new Map<string, EmployeeRoster>();
      const empEmailMap = new Map<string, EmployeeRoster>();
      roster.forEach(emp => {
        if (emp.employeeId) empCodeMap.set(emp.employeeId.trim().toLowerCase(), emp);
        if (emp.email) empEmailMap.set(emp.email.trim().toLowerCase(), emp);
      });

      const buffer = await uploadedFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        toast.error("The spreadsheet appears to be empty.");
        setParsing(false);
        return;
      }

      // Find column headers
      let colIdxEmpId = -1;
      let colIdxEmail = -1;
      let colIdxTargetShift = -1;
      let colIdxName = -1;
      let colIdxDept = -1;
      let colIdxDesig = -1;
      let colIdxCurrentShift = -1;

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        const val = String(cell.value || '').trim().toLowerCase();
        if (val.includes('employee id') || val.includes('emp id') || val === 'empid') colIdxEmpId = colNumber;
        else if (val.includes('email')) colIdxEmail = colNumber;
        else if (val.includes('new shift') || val.includes('target shift') || val.includes('assigned shift') || val === 'shift') colIdxTargetShift = colNumber;
        else if (val.includes('name')) colIdxName = colNumber;
        else if (val.includes('department') || val === 'dept') colIdxDept = colNumber;
        else if (val.includes('designation')) colIdxDesig = colNumber;
        else if (val.includes('current shift')) colIdxCurrentShift = colNumber;
      });

      // Fallback heuristics if column headers are non-standard
      if (colIdxEmpId === -1) colIdxEmpId = 1;
      if (colIdxTargetShift === -1) colIdxTargetShift = colIdxCurrentShift !== -1 ? 7 : (colIdxEmail !== -1 ? colIdxEmail + 1 : 2);

      const rows: ParsedRow[] = [];

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const empIdVal = String(row.getCell(colIdxEmpId).value || '').trim();
        const emailVal = colIdxEmail !== -1 ? String(row.getCell(colIdxEmail).value || '').trim() : '';
        const targetShiftVal = colIdxTargetShift !== -1 ? String(row.getCell(colIdxTargetShift).value || '').trim() : '';
        const nameVal = colIdxName !== -1 ? String(row.getCell(colIdxName).value || '').trim() : '';
        const deptVal = colIdxDept !== -1 ? String(row.getCell(colIdxDept).value || '').trim() : '';
        const desigVal = colIdxDesig !== -1 ? String(row.getCell(colIdxDesig).value || '').trim() : '';
        const currentShiftVal = colIdxCurrentShift !== -1 ? String(row.getCell(colIdxCurrentShift).value || '').trim() : '';

        // Skip completely empty rows
        if (!empIdVal && !emailVal && !targetShiftVal) continue;

        const emp = empCodeMap.get(empIdVal.toLowerCase()) || (emailVal ? empEmailMap.get(emailVal.toLowerCase()) : undefined);

        let isValid = true;
        let errorMsg = '';
        let resolvedShiftId: string | null = null;

        if (!emp) {
          isValid = false;
          errorMsg = `Employee '${empIdVal || emailVal}' not found in active roster`;
        } else if (!targetShiftVal) {
          isValid = false;
          errorMsg = 'New Shift Name is empty';
        } else {
          const lowerShift = targetShiftVal.toLowerCase();
          if (lowerShift === 'unassign' || lowerShift === 'unassigned' || lowerShift === 'none' || lowerShift === 'remove') {
            resolvedShiftId = null;
            isValid = true;
          } else {
            const matchedShift = shiftMap.get(lowerShift);
            if (!matchedShift) {
              isValid = false;
              errorMsg = `Shift '${targetShiftVal}' not found`;
            } else {
              resolvedShiftId = matchedShift.id;
              isValid = true;
            }
          }
        }

        rows.push({
          employeeId: emp ? emp.employeeId : (empIdVal || '—'),
          email: emp ? emp.email : (emailVal || '—'),
          name: emp ? `${emp.firstName} ${emp.lastName}` : (nameVal || 'Unknown'),
          department: emp?.department?.name || deptVal || '—',
          designation: emp?.designation?.name || desigVal || '—',
          currentShift: emp?.shift?.name || currentShiftVal || 'Unassigned',
          targetShiftName: targetShiftVal,
          resolvedShiftId,
          isValid,
          error: errorMsg
        });
      }

      setParsedRows(rows);
      toast.success(t(`Processed ${rows.length} rows from sheet`));
    } catch (err: any) {
      console.error("File parse error:", err);
      toast.error("Failed to parse file: " + err.message);
    } finally {
      setParsing(false);
    }
  };

  // 3. Submit Bulk Assignment
  const handleSubmitAssignments = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid shift assignment rows to apply.");
      return;
    }

    try {
      setSubmitting(true);
      const assignments = validRows.map(r => ({
        employeeId: r.employeeId,
        email: r.email,
        newShiftName: r.targetShiftName
      }));

      const res = await api.post('/shifts/bulk-assign-sheet', { assignments });

      if (res.data?.success) {
        toast.success(t(`Successfully assigned shifts to ${res.data.data?.successCount || validRows.length} employees!`));
        setResultSummary({
          success: res.data.data?.successCount || validRows.length,
          failed: res.data.data?.failedCount || 0
        });
        onSuccess();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to update shifts");
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.filter(r => !r.isValid).length;

  const displayedRows = parsedRows.filter(r => {
    if (filterType === 'VALID') return r.isValid;
    if (filterType === 'ERROR') return !r.isValid;
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {t("Bulk Shift Assignment")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("Download template, map employee shift profiles in bulk, and upload to assign shifts automatically.")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* MODAL CONTENT */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {resultSummary ? (
            /* SUCCESS COMPLETION SCREEN */
            <div className="p-8 text-center space-y-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("Shift Assignments Applied Successfully")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("All verified shift profiles have been assigned and updated in PostgreSQL and live rosters.")}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold text-xs font-mono">
                  {resultSummary.success} {t("Assigned")}
                </span>
                {resultSummary.failed > 0 && (
                  <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 font-bold text-xs font-mono">
                    {resultSummary.failed} {t("Skipped / Failed")}
                  </span>
                )}
              </div>
              <Button onClick={handleClose} className="mt-4 px-6 text-xs font-bold">
                {t("Done & Return to Roster")}
              </Button>
            </div>
          ) : parsedRows.length === 0 ? (
            /* STEP 1: DOWNLOAD & UPLOAD FILE */
            <div className="space-y-6">
              {/* Step 1 Card: Download */}
              <div className="p-4 border rounded-xl bg-card shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">1</span>
                    <h4 className="text-sm font-bold text-foreground">{t("Download Pre-filled Excel Sheet")}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground pl-7">
                    {t("Pre-filled with all")} <strong className="text-foreground">{roster.length} {t("employees")}</strong> {t("and reference notes for available shifts.")}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="h-9 px-4 text-xs font-semibold gap-2 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingTemplate ? t("Generating...") : t("Download .xlsx Template")}</span>
                </Button>
              </div>

              {/* Step 2 Card: Upload Dropzone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="text-sm font-bold text-foreground">{t("Upload Completed Sheet")}</h4>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-muted/10 transition-all rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {parsing ? t("Analyzing sheet...") : t("Click to browse or drag and drop Excel sheet")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("Supports .xlsx, .xls, or .csv files with Employee ID and New Shift columns")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Available Shifts Reference Chips */}
              <div className="p-3.5 bg-muted/30 border rounded-xl space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> {t("Configured Shifts Available to Assign:")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {shifts.map(s => (
                    <span key={s.id} className="text-xs px-2.5 py-1 rounded-md bg-background border font-semibold text-foreground flex items-center gap-1 shadow-2xs">
                      <span>{s.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({s.startTime}-{s.endTime})</span>
                    </span>
                  ))}
                  <span className="text-xs px-2 py-1 rounded-md bg-muted/60 border text-muted-foreground italic font-mono text-[11px]">
                    "UNASSIGN" (to remove shift)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: PRE-COMMIT PREVIEW TABLE */
            <div className="space-y-4">
              {/* Summary Metrics Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 border rounded-xl">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-foreground">
                    {t("Total Rows")}: <span className="font-mono">{parsedRows.length}</span>
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validCount} {t("Ready to Assign")}
                  </span>
                  {errorCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {errorCount} {t("Issues / Skipped")}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      filterType === 'ALL' ? 'bg-background shadow-xs text-primary font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterType('VALID')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      filterType === 'VALID' ? 'bg-background shadow-xs text-emerald-600 font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                  {errorCount > 0 && (
                    <button
                      onClick={() => setFilterType('ERROR')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        filterType === 'ERROR' ? 'bg-background shadow-xs text-rose-600 font-bold' : 'text-muted-foreground'
                      }`}
                    >
                      Errors ({errorCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Preview Table */}
              <div className="border rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 sticky top-0 border-b z-10 backdrop-blur-md">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold text-muted-foreground">Employee</th>
                      <th className="py-2.5 px-3 font-semibold text-muted-foreground">Department & Role</th>
                      <th className="py-2.5 px-3 font-semibold text-muted-foreground">Current Shift</th>
                      <th className="py-2.5 px-3 font-semibold text-muted-foreground">Target New Shift</th>
                      <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {displayedRows.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-muted/10 transition-colors ${!row.isValid ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{row.name}</span>
                            <span className="text-[11px] font-mono text-muted-foreground">{row.employeeId}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{row.department}</span>
                            <span className="text-[10px] text-muted-foreground">{row.designation}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-muted-foreground font-medium">{row.currentShift}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                            <Badge variant={row.isValid ? "default" : "destructive"} className="text-xs font-semibold py-0.5">
                              {row.targetShiftName || "None"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {row.isValid ? (
                            <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold text-[11px] flex items-center justify-end gap-1" title={row.error}>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[150px]">{row.error}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        {!resultSummary && (
          <DialogFooter className="p-4 px-6 border-t bg-muted/10 flex justify-between items-center sm:justify-between w-full">
            {parsedRows.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 text-xs"
                >
                  {t("Upload Different Sheet")}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-9 text-xs"
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitAssignments}
                    disabled={submitting || validCount === 0}
                    className="h-9 px-4 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{t("Applying...")}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t("Confirm & Assign")} ({validCount})</span>
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="ml-auto h-9 text-xs"
              >
                {t("Close")}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
