"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Download, UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export function BulkImportEmployeeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Progress & Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [batchInfo, setBatchInfo] = useState<{ current: number, total: number }>({ current: 0, total: 0 });
  const [uploadResults, setUploadResults] = useState<{ success: number, failed: number, errors: any[] } | null>(null);

  const handleReset = () => {
    setFile(null);
    setParsedRecords([]);
    setStep(1);
    setUploadResults(null);
    setIsUploading(false);
    setProgressPercent(0);
    setProcessedCount(0);
    setBatchInfo({ current: 0, total: 0 });
  };

  const handleClose = () => {
    if (isUploading) return; // Prevent closing while upload is actively running
    handleReset();
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Employee ID,First Name,Last Name,Email,Joining Date,Phone,Temporary Password,Base Salary,Department,Designation,Employment Type\nEMP-1001,John,Doe,john.doe@company.com,2026-06-25,9876543210,Pass@123,75000,Engineering,Software Engineer,FULL_TIME";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileParse = () => {
    if (!file) return toast.error("Please select a file first");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) return toast.error("File is empty or invalid");

      const employees = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length >= 4) {
          const empId = cols[0]?.trim();
          const firstName = cols[1]?.trim();
          const lastName = cols[2]?.trim();
          const email = cols[3]?.trim();

          if (empId && firstName && lastName && email) {
            employees.push({
              employeeId: empId,
              firstName,
              lastName,
              email,
              joiningDate: cols[4] ? cols[4].trim() : new Date().toISOString().split('T')[0],
              phone: cols[5] ? cols[5].trim() : "",
              password: cols[6] ? cols[6].trim() : "",
              baseSalary: cols[7] ? cols[7].trim() : "",
              departmentName: cols[8] ? cols[8].trim() : "",
              designationName: cols[9] ? cols[9].trim() : "",
              employmentType: cols[10] ? cols[10].trim() : "FULL_TIME",
            });
          }
        }
      }

      if (employees.length === 0) return toast.error("No valid records found in file");
      setParsedRecords(employees);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = async () => {
    if (parsedRecords.length === 0) return;

    setIsUploading(true);
    setProgressPercent(0);
    setProcessedCount(0);

    const total = parsedRecords.length;
    const CHUNK_SIZE = Math.min(20, Math.max(2, Math.ceil(total / 5)));
    const totalBatches = Math.ceil(total / CHUNK_SIZE);

    let totalSuccess = 0;
    const accumulatedErrors: any[] = [];

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = parsedRecords.slice(i, i + CHUNK_SIZE);
      const currentBatchNum = Math.floor(i / CHUNK_SIZE) + 1;
      setBatchInfo({ current: currentBatchNum, total: totalBatches });

      try {
        const res = await api.post("/employees/bulk-create", { employees: chunk });
        const data = res.data;

        if (data?.data?.successCount !== undefined) {
          totalSuccess += data.data.successCount;
        } else if (data?.success) {
          totalSuccess += chunk.length;
        }

        if (data?.data?.errors && Array.isArray(data.data.errors)) {
          const adjustedErrors = data.data.errors.map((errItem: any) => ({
            ...errItem,
            row: i + errItem.row
          }));
          accumulatedErrors.push(...adjustedErrors);
        }
      } catch (err: any) {
        const details = Array.isArray(err?.response?.data?.data) 
          ? err.response.data.data.map((d: any) => `${d.field}: ${d.message}`).join(', ')
          : (err?.response?.data?.message || "Batch upload failed");

        chunk.forEach((cItem: any, idx: number) => {
          accumulatedErrors.push({
            row: i + idx + 1,
            identifier: cItem.employeeId || cItem.email || `Row ${i + idx + 1}`,
            error: details
          });
        });
      }

      const currentProcessed = Math.min(total, i + chunk.length);
      setProcessedCount(currentProcessed);
      const calculatedPercent = Math.round((currentProcessed / total) * 100);
      setProgressPercent(calculatedPercent);

      // Brief animation pause between batches
      await new Promise(r => setTimeout(r, 250));
    }

    setIsUploading(false);
    setUploadResults({
      success: totalSuccess,
      failed: accumulatedErrors.length,
      errors: accumulatedErrors
    });

    if (accumulatedErrors.length === 0) {
      toast.success(`Successfully imported all ${totalSuccess} employees!`);
    } else {
      toast.warning(`Import finished: ${totalSuccess} successful, ${accumulatedErrors.length} failed.`);
    }

    queryClient.invalidateQueries({ queryKey: ["employees"] });
    queryClient.invalidateQueries({ queryKey: ["employeesSummary"] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${step === 1 ? 'sm:max-w-md' : 'sm:max-w-[95vw] md:max-w-4xl'} transition-all overflow-hidden flex flex-col max-h-[90vh]`}>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Bulk Import Employees' : isUploading ? 'Uploading Employees' : uploadResults ? 'Import Summary' : 'Preview Employees'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Download the template, fill in the employee details, and upload.' : isUploading ? 'Please wait while employee records are uploaded and validated.' : uploadResults ? 'Review the results of your bulk employee import.' : `Review the ${parsedRecords.length} employees parsed from your CSV before saving.`}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="py-6 space-y-6">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">1. Download Template</h4>
                <p className="text-xs text-blue-700/80 mb-3">Get the official CSV template with all the required columns.</p>
                <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-blue-700 border-blue-200" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" /> Download Template
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex items-start gap-4">
              <div className="bg-gray-200 p-2 rounded-lg text-gray-600">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">2. Upload Filled Data</h4>
                <Input 
                  type="file" 
                  accept=".csv" 
                  className="bg-white dark:bg-slate-900"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Upload Progress Loader View */}
        {step === 2 && isUploading && (
          <div className="py-10 px-4 space-y-6 flex flex-col items-center justify-center text-center">
            {/* Animated Icon with Pulsing Rings & Percentage Badge */}
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center animate-pulse shadow-inner">
                <UploadCloud className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="absolute -bottom-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg border border-white/20">
                {progressPercent}%
              </div>
            </div>

            {/* Header Info */}
            <div className="space-y-1 max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                Uploading Employees Data...
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Processing records into database. Please do not close this window.
              </p>
            </div>

            {/* Main Progress Bar Container */}
            <div className="w-full max-w-md space-y-2.5">
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-4 p-0.5 overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 h-full rounded-full transition-all duration-300 ease-out shadow-md"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              
              {/* Detailed Stats */}
              <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-slate-400 px-1">
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {processedCount} of {parsedRecords.length} completed
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {parsedRecords.length - processedCount} remaining ({progressPercent}%)
                </span>
              </div>
            </div>

            {/* Batch Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-900 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Processing batch {batchInfo.current} of {batchInfo.total}...</span>
            </div>
          </div>
        )}

        {/* CSV Preview Table */}
        {step === 2 && !isUploading && !uploadResults && (
          <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="border rounded-xl flex-1 overflow-auto shadow-sm w-full">
              <Table className="w-full min-w-[800px]">
                <TableHeader className="bg-gray-50 dark:bg-slate-800/80 sticky top-0 backdrop-blur-sm z-10 text-xs">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Emp ID</TableHead>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                    <TableHead className="whitespace-nowrap">Department</TableHead>
                    <TableHead className="whitespace-nowrap">Designation</TableHead>
                    <TableHead className="whitespace-nowrap">Salary</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRecords.map((record, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium text-xs whitespace-nowrap">{record.employeeId}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{record.firstName} {record.lastName}</TableCell>
                      <TableCell className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{record.email}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{record.departmentName || "-"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-gray-600">{record.designationName || "-"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap font-medium text-emerald-600">{record.baseSalary ? `$${Number(record.baseSalary).toLocaleString()}` : "-"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {record.employmentType ? (
                           <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium tracking-wide">{record.employmentType.replace('_', ' ')}</span>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> Ensure Employee IDs and Emails are unique. Duplicate records will fail during upload.
            </div>
          </div>
        )}

        {/* Final Upload Results Summary */}
        {uploadResults && !isUploading && (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl text-center border border-green-100 dark:border-green-900">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2"/>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{uploadResults.success}</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-300">Employees Imported</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl text-center border border-red-100 dark:border-red-900">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2"/>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{uploadResults.failed}</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-300">Failed to Import</p>
              </div>
            </div>

            {uploadResults.errors.length > 0 && (
              <div className="border border-red-200 dark:border-red-900/50 rounded-xl max-h-[200px] overflow-auto">
                <Table>
                  <TableHeader className="bg-red-50 dark:bg-red-950/50">
                    <TableRow>
                      <TableHead>Row #</TableHead>
                      <TableHead>Emp ID / Email</TableHead>
                      <TableHead>Error Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadResults.errors.map((e, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs font-semibold">Row {e.row}</TableCell>
                        <TableCell className="text-xs font-medium">{e.identifier}</TableCell>
                        <TableCell className="text-xs text-red-600 dark:text-red-400">{e.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          {step === 1 && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleFileParse} disabled={!file}>Continue to Preview</Button>
            </>
          )}
          {step === 2 && !uploadResults && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={isUploading}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={handleConfirmUpload} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading ({progressPercent}%)...
                  </>
                ) : (
                  "Confirm & Upload"
                )}
              </Button>
            </>
          )}
          {uploadResults && !isUploading && (
            <Button onClick={() => { queryClient.invalidateQueries({ queryKey: ["employees"] }); queryClient.invalidateQueries({ queryKey: ["employeesSummary"] }); handleClose(); }}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

