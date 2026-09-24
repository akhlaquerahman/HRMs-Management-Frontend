"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, MoreVertical, Eye, Download, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

interface PayrollTableProps {
  data: any[];
  loading?: boolean;
  isHR?: boolean;
  onView: (record: any) => void;
}

export function PayrollTable({ data, loading, isHR, onView }: PayrollTableProps) {
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

  const handleBulkDownload = () => {
    const ids = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (ids.length === 0) return;
    alert(`Downloading ${ids.length} payslips...`);
    setSelectedRows({});
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
      
      if (sortConfig.key === 'period') {
        valA = a.year * 100 + a.month;
        valB = b.year * 100 + b.month;
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
          <p className="text-muted-foreground font-medium animate-pulse">Loading payroll records...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Payroll Records Found</h3>
        <p className="text-sm text-muted-foreground">
          Payroll history will appear after salary processing.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PAID': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Paid</Badge>;
      case 'PROCESSED': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Processed</Badge>;
      case 'PENDING': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">Pending</Badge>;
      case 'FAILED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMonthName = (month: number) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(month - 1);
    return format(d, 'MMM');
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
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Showing <span className="text-blue-600 font-bold">{data?.length || 0}</span> Payroll Records
        </h3>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold text-blue-700">{selectedCount} record(s) selected</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handleBulkDownload}>
              <Download className="w-4 h-4 mr-1" /> Download Selected
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
              <th className="px-4 py-3">Payroll ID</th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('period')}>
                Period <SortIcon columnKey="period" />
              </th>
              {isHR && <th className="px-4 py-3">Employee</th>}
              <th className="px-4 py-3">Working / Paid</th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('grossSalary')}>
                Gross Salary <SortIcon columnKey="grossSalary" />
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('deductions')}>
                Deductions <SortIcon columnKey="deductions" />
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('netSalary')}>
                Net Salary <SortIcon columnKey="netSalary" />
              </th>
              <th className="px-4 py-3">Bank Details</th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => handleSort('status')}>
                Status <SortIcon columnKey="status" />
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.map((record) => (
              <tr key={record.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-4 py-3 pl-4" onClick={(e) => toggleSelect(record.id, e)}>
                  <Checkbox checked={!!selectedRows[record.id]} onCheckedChange={(c) => setSelectedRows(p => ({...p, [record.id]: !!c}))} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  #{record.id.slice(0,6).toUpperCase()}
                </td>
                <td className="px-4 py-3 font-medium">
                  {getMonthName(record.month)} {record.year}
                </td>
                {isHR && (
                  <td className="px-4 py-3 font-medium">
                    {record.employee?.firstName} {record.employee?.lastName}
                  </td>
                )}
                <td className="px-4 py-3 text-muted-foreground">
                  {record.workingDays} / {record.paidDays} Days
                </td>
                <td className="px-4 py-3">₹{record.grossSalary.toLocaleString()}</td>
                <td className="px-4 py-3 text-rose-600">₹{record.deductions.toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-emerald-600">₹{record.netSalary.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-xs truncate max-w-[120px]">{record.employee?.bankName || 'N/A'}</span>
                    {record.employee?.accountNumber && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {record.employee.accountNumber}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => onView(record)}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(record)}>
                          <Download className="w-4 h-4 mr-2" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => alert('Payslip sent successfully to the employee email!')}>
                          <FileText className="w-4 h-4 mr-2" /> Email Payslip
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t bg-muted/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows per page:</span>
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

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-medium">
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
