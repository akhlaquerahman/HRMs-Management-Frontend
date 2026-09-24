"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditTableProps {
  data: any[];
  loading?: boolean;
  totalItems: number;
  currentPage: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export function AuditTable({ data, loading, totalItems, currentPage, rowsPerPage, onPageChange, onRowsPerPageChange }: AuditTableProps) {
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const handleBulkExport = () => {
    const ids = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (ids.length === 0) return;
    alert(`Exporting ${ids.length} selected audit logs...`);
    setSelectedRows({});
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!data || !sortConfig) return data || [];
    return [...data].sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      
      if (sortConfig.key === 'user') {
        valA = a.user?.firstName || "";
        valB = b.user?.firstName || "";
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
          <p className="text-muted-foreground font-medium animate-pulse">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;

  const handleNextPage = () => { if (currentPage < totalPages) onPageChange(currentPage + 1); };
  const handlePrevPage = () => { if (currentPage > 1) onPageChange(currentPage - 1); };

  const toggleSelectAll = (checked: boolean) => {
    const newSelected: Record<string, boolean> = {};
    if (checked) {
      sortedData.forEach(r => newSelected[r.id] = true);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelect = (id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Showing <span className="text-blue-600 font-bold">{totalItems}</span> Audit Logs
        </h3>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold text-blue-700">{selectedCount} log(s) selected</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handleBulkExport}>
              <Download className="w-4 h-4 mr-1" /> Export Selected
            </Button>
          </div>
        </div>
      )}
      <div className="border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b-border/50 hover:bg-muted/50">
                <TableHead className="w-12 py-3 px-4">
                  <Checkbox 
                    checked={sortedData.length > 0 && sortedData.every(r => selectedRows[r.id])}
                    onCheckedChange={toggleSelectAll} 
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('timestamp')}>
                  {t("Timestamp")} {sortConfig?.key === 'timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('action')}>
                  {t("Action")} {sortConfig?.key === 'action' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('entityType')}>
                  {t("Entity")} {sortConfig?.key === 'entityType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('user')}>
                  {t("User")} {sortConfig?.key === 'user' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('ipAddress')}>
                  {t("IP Address")} {sortConfig?.key === 'ipAddress' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {t("No audit logs found matching the filters.")}
                  </TableCell>
                </TableRow>
              ) : sortedData.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow className={`border-b-border/50 hover:bg-muted/20 transition-colors ${expandedRows[log.id] ? 'bg-muted/10' : ''}`}>
                    <TableCell className="px-4">
                      <Checkbox checked={!!selectedRows[log.id]} onCheckedChange={() => toggleSelect(log.id)} />
                    </TableCell>
                    <TableCell className="px-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(log.id)}>
                        {expandedRows[log.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy, hh:mm:ss a')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-600 font-medium font-mono text-xs">{log.action}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{log.entityType}</span> <span className="text-muted-foreground text-xs">({log.entityId || "N/A"})</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {log.user ? (
                          <>
                            <span className="font-medium">{log.user.firstName} {log.user.lastName}</span>
                            <span className="text-xs text-muted-foreground">{log.user.email}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">System / Unknown</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{log.ipAddress || "Unknown"}</span>
                    </TableCell>
                  </TableRow>
                  {expandedRows[log.id] && (
                    <TableRow className="bg-muted/5 border-b-border/50">
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                          <div className="space-y-1 col-span-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Browser User Agent</p>
                            <p className="text-sm font-mono text-muted-foreground bg-background border p-2 rounded break-all">{log.userAgent || "Unknown Browser Agent"}</p>
                          </div>
                          {log.details && (
                            <div className="space-y-1 col-span-2">
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Change Details JSON</p>
                              <pre className="text-xs font-mono text-muted-foreground bg-background border p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Footer / Pagination matching EmployeeTable */}
      <div className="flex items-center justify-between text-sm text-muted-foreground p-4 bg-muted/10 border-t">
        <div className="flex items-center gap-2">
          <span>{t("Rows per page")}:</span>
          <Select value={rowsPerPage.toString()} onValueChange={(v) => { onRowsPerPageChange(Number(v)); }}>
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
            {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalItems)} {t("of")} {totalItems}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
