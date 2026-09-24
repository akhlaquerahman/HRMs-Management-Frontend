"use client";

import React from 'react';
import { Search, Plus, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';

interface UsersFilterToolbarProps {
  onSearch: (value: string) => void;
  onFilterChange: (value: string) => void;
  onReset: () => void;
  onCreateClick: () => void;
  roles: any[];
}

export function UsersFilterToolbar({
  onSearch,
  onFilterChange,
  onReset,
  onCreateClick,
  roles
}: UsersFilterToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder={t("Search by Name or Email...")} 
            className="pl-9 bg-background w-full"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
          <Select defaultValue="ALL" onValueChange={onFilterChange}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder={t("All Roles")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Roles")}</SelectItem>
              {roles.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onReset} title={t("Reset Filters")}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
