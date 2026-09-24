"use client";

import React, { useState } from 'react';
import { FileText, MoreVertical, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';

interface DocumentsTableProps {
  data: any[];
  loading?: boolean;
  onView: (record: any) => void;
  onEdit: (record: any) => void;
  onDelete: (id: string) => void;
}

export function DocumentsTable({ data, loading, onView, onEdit, onDelete }: DocumentsTableProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const all = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.id]: true }), {});
      setSelectedRows(all);
    } else {
      setSelectedRows({});
    }
  };

  const handleBulkDelete = () => {
    const ids = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (ids.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${ids.length} selected documents?`)) {
      ids.forEach(id => onDelete?.(id));
      setSelectedRows({});
    }
  };

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

  const sortedData = React.useMemo(() => {
    if (!data || !sortConfig) return data || [];
    return [...data].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'employeeName') {
        valA = `${a.employee?.firstName} ${a.employee?.lastName}`;
        valB = `${b.employee?.firstName} ${b.employee?.lastName}`;
      }
      if (sortConfig.key === 'documentType') {
        valA = a.documentType || '';
        valB = b.documentType || '';
      }
      if (sortConfig.key === 'verificationStatus') {
        valA = a.verificationStatus || '';
        valB = b.verificationStatus || '';
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-12">
        <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
        <p className="text-sm text-muted-foreground">
          There are no KYC documents matching your criteria.
        </p>
      </div>
    );
  }

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Showing <span className="text-blue-600 font-bold">{data?.length || 0}</span> Documents
        </h3>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold text-blue-700">{selectedCount} document(s) selected</span>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" className="h-8" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete Selected
            </Button>
          </div>
        </div>
      )}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-3 w-10 pl-4">
                  <Checkbox 
                    checked={data?.length > 0 && data.every((d: any) => selectedRows[d.id])}
                    onCheckedChange={toggleSelectAll} 
                  />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('employeeName')}>
                Employee <SortIcon columnKey="employeeName" />
              </th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('documentType')}>
                Document Type <SortIcon columnKey="documentType" />
              </th>
              <th className="px-4 py-3">Document No.</th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('verificationStatus')}>
                KYC Status <SortIcon columnKey="verificationStatus" />
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-4 py-3 pl-4" onClick={(e) => toggleSelect(doc.id, e)}>
                  <Checkbox checked={!!selectedRows[doc.id]} onCheckedChange={(c) => setSelectedRows(p => ({...p, [doc.id]: !!c}))} />
                </td>
                <td className="px-4 py-3 font-medium">
                  {doc.employee?.firstName} {doc.employee?.lastName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {doc.employee?.email}
                </td>
                <td className="px-4 py-3 font-semibold text-primary">
                  {doc.documentType}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {doc.encryptedDocumentNumber || "N/A"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {doc.verificationStatus === 'APPROVED' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : 
                     doc.verificationStatus === 'REJECTED' ? <XCircle className="w-4 h-4 text-rose-500" /> : 
                     <AlertCircle className="w-4 h-4 text-amber-500" />}
                    <span className={`text-xs font-semibold ${
                      doc.verificationStatus === 'APPROVED' ? 'text-emerald-700' : 
                      doc.verificationStatus === 'REJECTED' ? 'text-rose-700' : 
                      'text-amber-700'
                    }`}>
                      {doc.verificationStatus}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => onView(doc)}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(doc)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(doc.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="h-8 w-[70px]">
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
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
