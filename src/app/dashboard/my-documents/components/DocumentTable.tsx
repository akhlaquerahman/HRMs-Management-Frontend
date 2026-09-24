import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';

export function DocumentTable({ data, loading, onView, isHR }: { data: any[], loading: boolean, onView: (r: any) => void, isHR: boolean }) {
  const { t } = useTranslation();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading documents...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center border rounded-xl bg-white flex flex-col items-center justify-center">
        <FileText className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">{t("No documents found")}</h3>
        <p className="text-gray-500 text-sm">{t("Upload your first document to securely store it here.")}</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">{t("Verified")}</Badge>;
      case 'REJECTED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0">{t("Rejected")}</Badge>;
      case 'EXPIRING_SOON': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">{t("Expiring Soon")}</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">{t("Pending Review")}</Badge>;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[250px]">{t("Document Name")}</TableHead>
              {isHR && <TableHead>{t("Employee")}</TableHead>}
              <TableHead>{t("Category")}</TableHead>
              <TableHead>{t("Uploaded On")}</TableHead>
              <TableHead>{t("Size")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                      <FileText className="w-4 h-4" />
                    </div>
                    {doc.documentType}
                  </div>
                </TableCell>
                {isHR && (
                  <TableCell>
                    {doc.employee?.firstName} {doc.employee?.lastName}
                  </TableCell>
                )}
                <TableCell>
                  <span className="text-sm text-gray-500 capitalize">{doc.category.toLowerCase()}</span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(doc.createdAt), 'dd MMM yyyy')}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatSize(doc.size)}
                </TableCell>
                <TableCell>{getStatusBadge(doc.verificationStatus)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onView(doc)}>
                    <Eye className="w-4 h-4 mr-2" />
                    {t("View")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
