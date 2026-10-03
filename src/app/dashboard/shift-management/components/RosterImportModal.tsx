"use client";

import React, { useState } from 'react';
import api from '@/lib/axios';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  FileUp,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";

interface RosterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  designationId: string;
  weekStart: string;
  onImportSuccess: () => void;
}

export function RosterImportModal({
  isOpen,
  onClose,
  departmentId,
  designationId,
  weekStart,
  onImportSuccess
}: RosterImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    importedCount?: number;
    warnings?: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/roster/download-template', {
        params: { departmentId, designationId },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'HRMS_Roster_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to download template');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an XLSX file to upload.');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();

      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;

        try {
          const res = await api.post('/roster/import-xlsx', {
            departmentId,
            designationId,
            weekStart,
            fileData: base64Data
          });

          if (res.data?.success) {
            setResult({
              importedCount: res.data.data?.importedCount || 0,
              warnings: res.data.data?.warnings || []
            });
            onImportSuccess();
          } else {
            alert(res.data?.message || 'Failed to import roster');
          }
        } catch (err: any) {
          alert(err?.response?.data?.message || 'Failed to process import');
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(file);

    } catch (e: any) {
      alert('Failed to read file');
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Import Roster from Excel (.xlsx)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload a prepared offline Excel schedule. Imported rosters will be created as <strong>DRAFT</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleImportSubmit} className="space-y-4 py-2 text-xs">
          
          {/* Download Template Button */}
          <div className="p-3 rounded-xl border bg-muted/10 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-foreground block">Need an Offline Excel Template?</span>
              <span className="text-muted-foreground text-[11px] block">Download pre-filled template with employee list.</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="h-8 gap-1 text-xs font-semibold text-primary border-primary/20 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </Button>
          </div>

          {/* File Drag and Drop */}
          <div className="border-2 border-dashed rounded-xl p-6 text-center bg-card hover:bg-muted/10 transition-colors flex flex-col items-center justify-center gap-2">
            <FileUp className="w-8 h-8 text-muted-foreground" />
            <div>
              <label htmlFor="roster-xlsx-upload" className="font-bold text-primary hover:underline cursor-pointer">
                Click to browse file
              </label>
              <span className="text-muted-foreground block text-[11px] mt-0.5">Supports Microsoft Excel (.xlsx)</span>
            </div>
            <input 
              id="roster-xlsx-upload"
              type="file" 
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            {file && (
              <div className="mt-2 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Result Banner */}
          {result && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Imported {result.importedCount} entries as DRAFT!</span>
              </div>
              {result.warnings && result.warnings.length > 0 && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 space-y-0.5 pt-1">
                  {result.warnings.map((w, idx) => (
                    <div key={idx}>⚠ {w}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!file || uploading} className="font-bold bg-emerald-600 text-white hover:bg-emerald-700">
              {uploading ? 'Importing...' : 'Upload & Import Draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
