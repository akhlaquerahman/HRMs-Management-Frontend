"use client";

import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { UploadCloud, CheckCircle, FileText, AlertCircle, Loader2, X } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDocumentModal({ isOpen, onClose }: UploadDocumentModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [category, setCategory] = useState<string>('IDENTITY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch document types created on HR Admin side
  const { data: documentTypesData, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: async () => {
      const res = await api.get('/documents/types');
      return res.data?.data || [];
    },
    enabled: isOpen
  });

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setDocumentType('');
    setDocumentNumber('');
    setCategory('IDENTITY');
    setErrorMessage(null);
    setIsSubmitting(false);
    setIsDragOver(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMessage(t("File size exceeds 10MB limit."));
        return;
      }
      setFile(selected);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMessage(t("File size exceeds 10MB limit."));
        return;
      }
      setFile(selected);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage(t("Please select a file to upload."));
      return;
    }
    if (!documentType) {
      setErrorMessage(t("Please select a document type."));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (documentNumber) formData.append('documentNumber', documentNumber);
      if (category) formData.append('category', category);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      queryClient.invalidateQueries({ queryKey: ['documentRecords'] });
      queryClient.invalidateQueries({ queryKey: ['documentSummary'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });

      setStep(2);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || t("Failed to upload document. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            {t("Upload Document")}
          </DialogTitle>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* File Dropzone */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.svg"
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-primary bg-primary/5 scale-[0.99]'
                    : 'border-gray-200 hover:bg-gray-50/80 hover:border-primary/50'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900">
                  {t("Click to upload")} <span className="text-gray-500 font-normal">{t("or drag and drop")}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG, PDF or DOC (max. 10MB)</p>
              </div>
            ) : (
              <div className="p-3 border rounded-xl bg-gray-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate text-xs">
                    <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                    <p className="text-gray-500 text-[11px]">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-rose-600"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Document Type Dropdown (Populated from HR Admin created types) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">{t("Document Type")} *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder={isLoadingTypes ? t("Loading document types...") : t("Select Document Type")} />
                </SelectTrigger>
                <SelectContent>
                  {documentTypesData && documentTypesData.length > 0 ? (
                    documentTypesData.map((type: any) => (
                      <SelectItem key={type.id || type.name} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Aadhaar Card">{t("Aadhaar Card")}</SelectItem>
                      <SelectItem value="PAN Card">{t("PAN Card")}</SelectItem>
                      <SelectItem value="Passport">{t("Passport")}</SelectItem>
                      <SelectItem value="Driving License">{t("Driving License")}</SelectItem>
                      <SelectItem value="10th Marksheet">{t("10th Marksheet")}</SelectItem>
                      <SelectItem value="12th Marksheet">{t("12th Marksheet")}</SelectItem>
                      <SelectItem value="Degree Certificate">{t("Degree Certificate")}</SelectItem>
                      <SelectItem value="Offer Letter">{t("Offer Letter")}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Document ID (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">{t("Document ID / Number (Optional)")}</Label>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder={t("e.g. XXXX-XXXX-1234")}
                className="text-xs font-mono"
              />
            </div>

            {/* Document Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">{t("Category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder={t("Select Category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDENTITY">{t("Identity")}</SelectItem>
                  <SelectItem value="EMPLOYMENT">{t("Employment")}</SelectItem>
                  <SelectItem value="PAYROLL">{t("Payroll")}</SelectItem>
                  <SelectItem value="BANK">{t("Bank")}</SelectItem>
                  <SelectItem value="EDUCATION">{t("Education")}</SelectItem>
                  <SelectItem value="COMPLIANCE">{t("Compliance")}</SelectItem>
                  <SelectItem value="MEDICAL">{t("Medical")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || !file || !documentType} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("Uploading...")}
                  </>
                ) : (
                  t("Upload & Submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 2 && (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{t("Document Uploaded Successfully")}</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">{t("Your document has been stored securely in your vault and submitted for HR verification.")}</p>
            <Button onClick={handleClose} className="w-full mt-6 bg-primary hover:bg-primary/90">
              {t("Done")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
