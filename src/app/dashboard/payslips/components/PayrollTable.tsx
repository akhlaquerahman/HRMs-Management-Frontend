"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, MoreVertical, Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  if (loading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/20 border-b">
          <div className="h-6 bg-muted rounded w-1/4" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-muted/40 rounded animate-pulse" />
          ))}
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
    d.setMonth(month - 1);
    return format(d, 'MMM');
  };

  // Pagination Logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

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
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-semibold sticky top-0">
            <tr>
              <th className="px-4 py-3">Payroll ID</th>
              <th className="px-4 py-3">Period</th>
              {isHR && <th className="px-4 py-3">Employee</th>}
              <th className="px-4 py-3">Working / Paid</th>
              <th className="px-4 py-3">Gross Salary</th>
              <th className="px-4 py-3">Deductions</th>
              <th className="px-4 py-3">Net Salary</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.map((record) => (
              <tr key={record.id} className="hover:bg-muted/20 transition-colors group">
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
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
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
  );
}
