"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export function BulkUploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
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
    const csvContent = "data:text/csv;charset=utf-8,Employee ID,Date,Check In Time,Check Out Time,Status\nEMP-1001,2026-06-25,09:00:00,18:00:00,PRESENT";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadMutation = useMutation({
    mutationFn: async (records: any[]) => (await api.post("/attendance/bulk", { records })).data,
    onSuccess: (data) => {
      toast.success(data.message || "Bulk upload finished");
      if (data.data?.errors) {
        setUploadResults({ success: data.data.successCount, failed: data.data.errors.length, errors: data.data.errors });
      } else {
        queryClient.invalidateQueries({ queryKey: ["attendanceOpsList"] });
        queryClient.invalidateQueries({ queryKey: ["attendanceOpsSummary"] });
        handleClose();
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to upload")
  });

  const handleFileParse = () => {
    if (!file) return toast.error("Please select a file first");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) return toast.error("File is empty or invalid");

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length >= 5) {
          records.push({
            employeeId: cols[0].trim(),
            date: cols[1].trim(),
            punchIn: cols[2].trim() ? `${cols[1].trim()}T${cols[2].trim()}` : null,
            punchOut: cols[3].trim() ? `${cols[1].trim()}T${cols[3].trim()}` : null,
            status: cols[4].trim().toUpperCase()
          });
        }
      }

      if (records.length === 0) return toast.error("No valid records found in file");
      setParsedRecords(records);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = () => {
    uploadMutation.mutate(parsedRecords);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-[${step === 1 ? '450px' : '750px'}] transition-all`}>
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Bulk Upload Attendance' : 'Preview Records'}</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Download the template, fill in the records, and upload.' : `Review the ${parsedRecords.length} records parsed from your CSV before saving to the database.`}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">CSV Template</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">attendance_template.csv</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <Input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
          </div>
        )}

        {step === 2 && !uploadResults && (
          <div className="py-4 space-y-4">
            <div className="border rounded-lg max-h-[350px] overflow-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRecords.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-gray-500 dark:text-slate-400">{i+1}</TableCell>
                      <TableCell className="font-medium text-blue-600">{r.employeeId}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.punchIn ? new Date(r.punchIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</TableCell>
                      <TableCell>{r.punchOut ? new Date(r.punchOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> Please ensure Employee IDs exactly match your database.
            </div>
          </div>
        )}

        {uploadResults && (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center border border-green-100">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2"/>
                <p className="text-2xl font-bold text-green-700">{uploadResults.success}</p>
                <p className="text-sm font-medium text-green-600">Rows Imported</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center border border-red-100">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2"/>
                <p className="text-2xl font-bold text-red-700">{uploadResults.failed}</p>
                <p className="text-sm font-medium text-red-600">Rows Failed</p>
              </div>
            </div>

            {uploadResults.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg max-h-[200px] overflow-auto">
                <Table>
                  <TableHeader className="bg-red-50">
                    <TableRow>
                      <TableHead>Row #</TableHead>
                      <TableHead>Emp ID</TableHead>
                      <TableHead>Error Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadResults.errors.map((e, idx) => (
                      <TableRow key={idx}>
                        <TableCell>Row {e.row}</TableCell>
                        <TableCell className="font-medium">{e.employeeId}</TableCell>
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
              <Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button onClick={handleConfirmUpload} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Saving to Database..." : <><UploadCloud className="w-4 h-4 mr-2" /> Confirm & Upload</>}
              </Button>
            </>
          )}
          {uploadResults && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
