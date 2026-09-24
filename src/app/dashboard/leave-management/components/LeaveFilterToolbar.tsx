"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, RefreshCw, Download, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeaveFilterToolbarProps {
  onSearch: (val: string) => void;
  onFilterChange: (key: string, val: string) => void;
  onReset: () => void;
  onExport: () => void;
  showEmployeeFilter?: boolean;
}

export function LeaveFilterToolbar({ 
  onSearch, 
  onFilterChange, 
  onReset, 
  onExport,
  showEmployeeFilter = false
}: LeaveFilterToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card border rounded-xl shadow-sm p-3.5 flex flex-col lg:flex-row items-center justify-between gap-3">
      
      <div className="flex flex-1 items-center gap-2.5 w-full flex-wrap sm:flex-nowrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px] w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t("Search by ID, reason, or employee...")} 
            className="pl-9 h-9 text-xs bg-background"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <Select onValueChange={(val) => onFilterChange('status', val)} defaultValue="ALL">
          <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs bg-background">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder={t("Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Statuses")}</SelectItem>
            <SelectItem value="PENDING">{t("Pending")}</SelectItem>
            <SelectItem value="APPROVED">{t("Approved")}</SelectItem>
            <SelectItem value="REJECTED">{t("Rejected")}</SelectItem>
            <SelectItem value="CANCELLED">{t("Cancelled")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Leave Type Dropdown */}
        <Select onValueChange={(val) => onFilterChange('leaveType', val)} defaultValue="ALL">
          <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs bg-background">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder={t("Leave Type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Types")}</SelectItem>
            <SelectItem value="SICK">{t("Sick / Medical")}</SelectItem>
            <SelectItem value="CASUAL">{t("Casual Leave")}</SelectItem>
            <SelectItem value="ANNUAL">{t("Annual Leave")}</SelectItem>
            <SelectItem value="EARNED">{t("Earned Leave")}</SelectItem>
            <SelectItem value="MATERNITY">{t("Maternity Leave")}</SelectItem>
            <SelectItem value="UNPAID">{t("Unpaid Leave")}</SelectItem>
          </SelectContent>
        </Select>

        {showEmployeeFilter && (
          <Select onValueChange={(val) => onFilterChange('department', val)} defaultValue="ALL">
            <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs bg-background">
              <SelectValue placeholder={t("Department")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Departments")}</SelectItem>
              <SelectItem value="HR">{t("HR")}</SelectItem>
              <SelectItem value="Engineering">{t("Engineering")}</SelectItem>
              <SelectItem value="Sales">{t("Sales")}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full lg:w-auto justify-end shrink-0">
        <Button variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5" onClick={onReset} title="Reset Filters">
          <RefreshCw className="w-3.5 h-3.5" />
          {t("Reset")}
        </Button>
        <Button variant="default" size="sm" className="h-9 px-3 text-xs gap-1.5" onClick={onExport}>
          <Download className="w-3.5 h-3.5" />
          {t("Export CSV")}
        </Button>
      </div>

    </div>
  );
}
