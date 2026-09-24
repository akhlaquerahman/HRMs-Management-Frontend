"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [uploadResults, setUploadResults] = useState<{ success: number, failed: number, errors: any[] } | null>(null);

  const handleReset = () => {
    setFile(null);
    setParsedRecords([]);
    setStep(1);
    setUploadResults(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Employee ID,First Name,Last Name,Email,Joining Date,Phone,Temporary Password,Base Salary,Department,Designation,Employment Type\nEMP-1001,John,Doe,john.doe@company.com,2026-06-25,555-1234,Pass@123,75000,Engineering,Software Engineer,FULL_TIME";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadMutation = useMutation({
    mutationFn: async (employees: any[]) => (await api.post("/employees/bulk-create", { employees })).data,
    onSuccess: (data) => {
      toast.success(data.message || "Bulk import finished");
      if (data.data?.errors) {
        setUploadResults({ success: data.data.successCount, failed: data.data.errors.length, errors: data.data.errors });
      } else {
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        queryClient.invalidateQueries({ queryKey: ["employeesSummary"] });
        handleClose();
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to import employees")
  });

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
        if (cols.length >= 5) {
          employees.push({
            employeeId: cols[0]?.trim(),
            firstName: cols[1]?.trim(),
            lastName: cols[2]?.trim(),
            email: cols[3]?.trim(),
            joiningDate: cols[4]?.trim(),
            phone: cols[5] ? cols[5].trim() : "",
            password: cols[6] ? cols[6].trim() : "",
            baseSalary: cols[7] ? cols[7].trim() : "",
            departmentName: cols[8] ? cols[8].trim() : "",
            designationName: cols[9] ? cols[9].trim() : "",
            employmentType: cols[10] ? cols[10].trim() : "",
          });
        }
      }

      if (employees.length === 0) return toast.error("No valid records found in file");
      setParsedRecords(employees);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = () => {
    uploadMutation.mutate(parsedRecords);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${step === 1 ? 'sm:max-w-md' : 'sm:max-w-[95vw] md:max-w-4xl'} transition-all overflow-hidden flex flex-col max-h-[90vh]`}>
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Bulk Import Employees' : 'Preview Employees'}</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Download the template, fill in the employee details, and upload.' : `Review the ${parsedRecords.length} employees parsed from your CSV before saving.`}
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

        {step === 2 && !uploadResults && (
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

        {uploadResults && (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center border border-green-100">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2"/>
                <p className="text-2xl font-bold text-green-700">{uploadResults.success}</p>
                <p className="text-sm font-medium text-green-600">Employees Imported</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center border border-red-100">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2"/>
                <p className="text-2xl font-bold text-red-700">{uploadResults.failed}</p>
                <p className="text-sm font-medium text-red-600">Failed to Import</p>
              </div>
            </div>

            {uploadResults.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg max-h-[200px] overflow-auto">
                <Table>
                  <TableHeader className="bg-red-50">
                    <TableRow>
                      <TableHead>Row #</TableHead>
                      <TableHead>Emp ID / Email</TableHead>
                      <TableHead>Error Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadResults.errors.map((e, idx) => (
                      <TableRow key={idx}>
                        <TableCell>Row {e.row}</TableCell>
                        <TableCell className="font-medium">{e.identifier}</TableCell>
                        <TableCell className="text-red-600">{e.error}</TableCell>
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
              <Button variant="outline" onClick={() => setStep(1)} disabled={uploadMutation.isPending}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={handleConfirmUpload} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                  </>
                ) : (
                  "Confirm & Upload"
                )}
              </Button>
            </>
          )}
          {uploadResults && (
            <Button onClick={() => { queryClient.invalidateQueries({ queryKey: ["employees"] }); queryClient.invalidateQueries({ queryKey: ["employeesSummary"] }); handleClose(); }}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
