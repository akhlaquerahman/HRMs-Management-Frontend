"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight, FileDown, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DashboardDataTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onExport?: () => void;
  searchable?: boolean;
  searchKey?: keyof T;
  headerAction?: React.ReactNode;
}

export function DashboardDataTable<T>({ 
  title, 
  data, 
  columns, 
  loading, 
  onExport,
  searchable,
  searchKey,
  headerAction
}: DashboardDataTableProps<T>) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data || [];
    return (data || []).filter((item) => {
      const val = item[searchKey];
      if (typeof val === 'string') {
        return val.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }, [data, searchTerm, searchKey]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <h3 className="font-bold text-base text-foreground tracking-tight">{t(title)}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {searchable && (
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder={t('Search...')} 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-8 text-xs bg-background rounded-lg border-muted"
              />
            </div>
          )}
          {headerAction}
          {onExport && (
            <Button variant="outline" size="icon" onClick={onExport} className="h-8 w-8 rounded-lg">
              <FileDown className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm text-left border-collapse">
          <thead className="text-[11px] text-muted-foreground uppercase font-semibold bg-muted/30 border-b">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 font-semibold tracking-wider ${col.className || ''}`}>
                  {t(col.header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              Array.from({ length: itemsPerPage }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3">
                      <div className="h-4 bg-muted/60 animate-pulse rounded-md w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  {t('No data available')}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  {columns.map((col, cIdx) => {
                    let content = typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor as keyof T] as any);
                    
                    if (content && typeof content === 'object' && !React.isValidElement(content)) {
                      content = content.name || content.title || JSON.stringify(content);
                    }
                    
                    return (
                      <td key={cIdx} className={`px-4 py-3.5 max-w-[220px] truncate ${col.className || ''}`}>
                        {content as React.ReactNode}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="p-3 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t('Showing')} <strong className="font-semibold text-foreground">{filteredData.length > 0 ? Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length) : 0}</strong> {t('to')} <strong className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> {t('of')} <strong className="font-semibold text-foreground">{filteredData.length}</strong>
        </span>
        <div className="flex items-center gap-1.5">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 rounded-lg" 
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[11px] px-2 font-medium">
            {currentPage} / {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 rounded-lg"
            disabled={currentPage === totalPages || loading}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
