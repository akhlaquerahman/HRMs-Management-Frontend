"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PayrollFilterToolbarProps {
  onSearch: (val: string) => void;
  onFilterChange: (key: string, val: string) => void;
  onReset: () => void;
  onExportCSV: () => void;
  showEmployeeFilter?: boolean;
  onCreateClick?: () => void;
  onBulkPayClick?: () => void;
  filters?: any;
}

export function PayrollFilterToolbar({ 
  onSearch, 
  onFilterChange, 
  onReset, 
  onExportCSV,
  showEmployeeFilter = false,
  onCreateClick,
  onBulkPayClick,
  filters
}: PayrollFilterToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-card border rounded-xl shadow-sm md:flex-row md:items-center md:justify-between">
      
      <div className="grid grid-cols-2 sm:flex sm:flex-1 sm:items-center gap-2 sm:gap-3">
        <div className="relative col-span-2 sm:col-span-1 w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t("Search by ID or Name...")} 
            className="pl-9 h-9 sm:h-10 text-xs sm:text-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <Select onValueChange={(val) => onFilterChange('year', val)} defaultValue="ALL">
          <SelectTrigger className="w-full sm:w-[120px] h-9 sm:h-10 text-xs sm:text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder={t("Year")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Years")}</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => onFilterChange('month', val)} defaultValue="ALL">
          <SelectTrigger className="w-full sm:w-[120px] h-9 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder={t("Month")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Months")}</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
              <SelectItem key={m} value={m.toString()}>Month {m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => onFilterChange('status', val)} defaultValue="ALL">
          <SelectTrigger className="w-full col-span-2 sm:col-span-1 sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder={t("Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Statuses")}</SelectItem>
            <SelectItem value="PENDING">{t("Pending")}</SelectItem>
            <SelectItem value="PROCESSED">{t("Processed")}</SelectItem>
            <SelectItem value="PAID">{t("Paid")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm" onClick={onReset}>
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          {t("Reset")}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm" onClick={onExportCSV}>
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          CSV
        </Button>
        {onBulkPayClick && (
          <Button size="sm" className="h-10 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={onBulkPayClick}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {t("Bulk Pay")}
          </Button>
        )}
        {onCreateClick && (
          <Button size="sm" className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onCreateClick}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {t("Pay Salary")}
          </Button>
        )}
      </div>

    </div>
  );
}
