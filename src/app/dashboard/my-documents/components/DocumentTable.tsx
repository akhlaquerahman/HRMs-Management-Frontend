import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DocumentTable({ data, loading, onView, isHR }: { data: any[], loading: boolean, onView: (r: any) => void, isHR: boolean }) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedData = React.useMemo(() => {
    if (!data || !sortConfig) return data || [];
    return [...data].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'employeeName') {
        valA = `${a.employee?.firstName} ${a.employee?.lastName}`;
        valB = `${b.employee?.firstName} ${b.employee?.lastName}`;
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-12">
        <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center border rounded-xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
        <FileText className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">{t("No documents found")}</h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm">{t("Upload your first document to securely store it here.")}</p>
      </div>
    );
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline-block" /> : <ChevronDown className="w-3 h-3 ml-1 inline-block" />;
    }
    return <ArrowUpDown className="w-3 h-3 ml-1 inline-block text-muted-foreground/30 group-hover:text-muted-foreground" />;
  };

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (val: string) => {
    setItemsPerPage(Number(val));
    setCurrentPage(1);
  };

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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-slate-800">
            <TableRow>
              <TableHead className="w-[250px] cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('documentType')}>
                {t("Document Name")} <SortIcon columnKey="documentType" />
              </TableHead>
              {isHR && (
                <TableHead className="cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('employeeName')}>
                  {t("Employee")} <SortIcon columnKey="employeeName" />
                </TableHead>
              )}
              <TableHead className="cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('category')}>
                {t("Category")} <SortIcon columnKey="category" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('createdAt')}>
                {t("Uploaded On")} <SortIcon columnKey="createdAt" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('size')}>
                {t("Size")} <SortIcon columnKey="size" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('verificationStatus')}>
                {t("Status")} <SortIcon columnKey="verificationStatus" />
              </TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
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
                  <span className="text-sm text-gray-500 dark:text-slate-400 capitalize">{doc.category?.toLowerCase()}</span>
                </TableCell>
                <TableCell className="text-sm text-gray-500 dark:text-slate-400">
                  {format(new Date(doc.createdAt), 'dd MMM yyyy')}
                </TableCell>
                <TableCell className="text-sm text-gray-500 dark:text-slate-400">
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

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, data.length)} of {data.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-white dark:bg-slate-900"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-white dark:bg-slate-900"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
