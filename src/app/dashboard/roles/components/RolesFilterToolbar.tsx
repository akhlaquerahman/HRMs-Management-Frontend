import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RolesFilterToolbarProps {
  onSearch: (val: string) => void;
  onFilterChange: (val: string) => void;
  onReset: () => void;
}

export function RolesFilterToolbar({ onSearch, onFilterChange, onReset }: RolesFilterToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder={t("Search roles by name or description...")} 
            className="pl-9 bg-background w-full"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
          <Select defaultValue="ALL" onValueChange={onFilterChange}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder={t("All Types")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Types")}</SelectItem>
              <SelectItem value="CORE">{t("Core Roles")}</SelectItem>
              <SelectItem value="CUSTOM">{t("Custom Roles")}</SelectItem>
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
