import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Download, FileText, Share2, ShieldCheck, History, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';

interface DocumentPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  isHR: boolean;
}

export function DocumentPreviewDrawer({ isOpen, onClose, record, isHR }: DocumentPreviewDrawerProps) {
  const { t } = useTranslation();
  const [secureUrl, setSecureUrl] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  useEffect(() => {
    if (isOpen && record?.id) {
      setIsLoadingUrl(true);
      api.get(`/documents/${record.id}/download`)
        .then(res => {
          if (res.data?.success) {
            setSecureUrl(res.data.data.downloadUrl);
          }
        })
        .catch(err => console.error("Failed to load secure URL", err))
        .finally(() => setIsLoadingUrl(false));
    } else {
      setSecureUrl('');
    }
  }, [isOpen, record?.id]);

  if (!record) return null;

  const handleDownload = () => {
    if (secureUrl) {
      window.open(secureUrl, '_blank');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col gap-0 border-l shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6">
          <SheetHeader className="pb-6 border-b mb-6">
            <div className="flex justify-between items-start">
              <div>
                <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  {record.documentType}
                </SheetTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("Uploaded on")} {format(new Date(record.createdAt), 'dd MMMM yyyy')}
                </p>
              </div>
              {record.verificationStatus === 'VERIFIED' && (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
                  {t("Verified")}
                </Badge>
              )}
              {record.verificationStatus === 'PENDING' && (
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                  {t("Pending Review")}
                </Badge>
              )}
              {record.verificationStatus === 'REJECTED' && (
                <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0">
                  {t("Rejected")}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-muted/20 border rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">{t("Category")}</p>
              <p className="font-medium capitalize">{record.category.toLowerCase()}</p>
            </div>
            <div className="p-4 bg-muted/20 border rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">{t("Document ID")}</p>
              <p className="font-medium">{record.encryptedDocumentNumber || 'N/A'}</p>
            </div>
            {record.expiryDate && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-sm text-amber-700 mb-1">{t("Expiry Date")}</p>
                <p className="font-medium text-amber-900">{format(new Date(record.expiryDate), 'dd MMM yyyy')}</p>
              </div>
            )}
          </div>

          {/* Verification Details */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {t("Verification Status")}
            </h3>
            <div className="p-4 border rounded-xl">
              {record.verificationStatus === 'VERIFIED' ? (
                <p className="text-sm">{t("Verified on")} {record.verifiedAt ? format(new Date(record.verifiedAt), 'dd MMM yyyy') : 'N/A'}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("This document is currently pending verification from HR.")}</p>
              )}
            </div>
          </div>

          {/* Document Inline Preview */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t("Document Preview")}
            </h3>
            <div className="w-full bg-muted/10 border rounded-xl overflow-hidden flex items-center justify-center relative min-h-[400px]">
              {isLoadingUrl ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-sm text-muted-foreground">{t("Loading secure document...")}</p>
                </div>
              ) : secureUrl && record.mimeType?.includes('image') ? (
                <img 
                  src={secureUrl} 
                  alt={record.documentType} 
                  className="max-w-full max-h-[600px] object-contain p-2"
                />
              ) : secureUrl && (record.mimeType?.includes('pdf') || secureUrl.toLowerCase().split('?')[0].endsWith('.pdf')) ? (
                <iframe 
                  src={`${secureUrl}#toolbar=0`} 
                  className="w-full h-[600px] border-0"
                  title="Document Preview"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">{t("Preview is not available for this file format.")}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={handleDownload} disabled={!secureUrl}>
                    <Download className="w-4 h-4 mr-2" /> {t("Download to View")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Audit History (Timeline) */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {t("Audit History")}
            </h3>
            <div className="space-y-4 border-l-2 border-muted ml-3 pl-4">
              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-white" />
                <p className="text-sm font-medium">{t("Document Uploaded")}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(record.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>
              {record.verifiedAt && (
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-white" />
                  <p className="text-sm font-medium">{t("Document Verified")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(record.verifiedAt), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 bg-muted/30 border-t flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="hidden sm:inline-flex">{t("Close")}</Button>
          <Button variant="outline" onClick={handleDownload} className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-white">
            <Download className="w-4 h-4 mr-2" /> {t("Download")}
          </Button>
          
          {isHR && record.verificationStatus === 'PENDING' && (
            <>
              <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 bg-white">
                <XCircle className="w-4 h-4 mr-2" /> {t("Reject")}
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle className="w-4 h-4 mr-2" /> {t("Approve")}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
