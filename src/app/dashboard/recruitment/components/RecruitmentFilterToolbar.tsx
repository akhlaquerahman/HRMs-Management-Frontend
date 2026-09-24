"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RecruitmentFilterToolbarProps {
  onSearch: (val: string) => void;
  onFilterChange: (key: string, val: string) => void;
  onReset: () => void;
  roles: any[];
  onCreateClick?: () => void;
}

export function RecruitmentFilterToolbar({ 
  onSearch, 
  onFilterChange, 
  onReset, 
  roles,
  onCreateClick
}: RecruitmentFilterToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border rounded-xl shadow-sm md:flex-row md:items-center md:justify-between">
      
      <div className="flex flex-1 items-center gap-3 flex-wrap">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t("Search by Name or Email...")} 
            className="pl-9 h-10"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <Select onValueChange={(val) => onFilterChange('jobRoleId', val)} defaultValue="ALL">
          <SelectTrigger className="w-[180px] h-10">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("Job Role")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Job Roles")}</SelectItem>
            {roles?.map(r => (
              <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => onFilterChange('status', val)} defaultValue="ALL">
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue placeholder={t("Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Statuses")}</SelectItem>
            <SelectItem value="PENDING">{t("Pending")}</SelectItem>
            <SelectItem value="DONE">{t("Interview Done")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" className="h-10 px-4" onClick={onReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("Reset")}
        </Button>
        {onCreateClick && (
          <Button size="sm" className="h-10 px-4" onClick={onCreateClick}>
            <Plus className="w-4 h-4 mr-2" />
            {t("Create New Candidate")}
          </Button>
        )}
      </div>

    </div>
  );
}
