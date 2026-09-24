"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
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
}

export function DashboardDataTable<T>({ 
  title, 
  data, 
  columns, 
  loading, 
  onExport,
  searchable,
  searchKey
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
    <div className="flex flex-col h-full bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20">
        <h3 className="font-semibold text-lg">{t(title)}</h3>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {searchable && (
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('Search...')} 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 pl-9 bg-background"
              />
            </div>
          )}
          {onExport && (
            <Button variant="outline" size="icon" onClick={onExport} className="h-9 w-9">
              <FileDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/40 sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 font-medium ${col.className || ''}`}>
                  {t(col.header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: itemsPerPage }).map((_, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {t('No data available')}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  {columns.map((col, cIdx) => {
                    let content = typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor as keyof T] as any);
                    
                    // Safe render fallback for accidental objects
                    if (content && typeof content === 'object' && !React.isValidElement(content)) {
                      content = content.name || content.title || JSON.stringify(content);
                    }
                    
                    return (
                      <td key={cIdx} className={`px-4 py-3 ${col.className || ''}`}>
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

      <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {t('Showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} {t('to')} {Math.min(currentPage * itemsPerPage, filteredData.length)} {t('of')} {filteredData.length}
        </span>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs px-2 font-medium">
            {currentPage} / {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7"
            disabled={currentPage === totalPages || loading}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
