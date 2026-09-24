import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, RotateCcw } from 'lucide-react';
import api from '@/lib/axios';

interface AdvancedFilterToolbarProps {
  filters: any;
  onFilterChange: (key: string, val: string) => void;
  onReset: () => void;
}

export function AdvancedFilterToolbar({ filters, onFilterChange, onReset }: AdvancedFilterToolbarProps) {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  useEffect(() => {
    const fetchSelectOptions = async () => {
      try {
        const [deptRes, desigRes] = await Promise.all([
          api.get('/departments'),
          api.get('/designations')
        ]);
        setDepartments(deptRes.data.data || []);
        setDesignations(desigRes.data.data || []);
      } catch (err) {}
    };
    fetchSelectOptions();
  }, []);

  const [localSearch, setLocalSearch] = useState(filters.search || '');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== localSearch) {
        onFilterChange('search', localSearch);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [localSearch, onFilterChange, filters.search]);

  useEffect(() => {
    // Sync if filters reset externally
    if (filters.search === '') {
      setLocalSearch('');
    }
  }, [filters.search]);

  return (
    <div className="bg-card border rounded-xl p-3 sm:p-4 shadow-sm space-y-3 sm:space-y-4">
      <div className="flex flex-col md:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder={t("Search by Name, Email, or ID...")} 
            className="pl-9 bg-background w-full h-9 sm:h-10 text-xs sm:text-sm"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-2 items-center w-full md:w-auto">
          <Select value={filters.department} onValueChange={(val) => onFilterChange('department', val)}>
            <SelectTrigger className="w-full md:w-[150px] bg-background h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder={t("Department")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Departments")}</SelectItem>
              {departments.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.designation} onValueChange={(val) => onFilterChange('designation', val)}>
            <SelectTrigger className="w-full md:w-[150px] bg-background h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder={t("Designation")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Designations")}</SelectItem>
              {designations.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filters.status} onValueChange={(val) => onFilterChange('status', val)}>
            <SelectTrigger className="w-full md:w-[130px] bg-background h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder={t("Status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Status")}</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.employmentType} onValueChange={(val) => onFilterChange('employmentType', val)}>
            <SelectTrigger className="w-full md:w-[140px] bg-background h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder={t("Emp. Type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Types")}</SelectItem>
              <SelectItem value="FULL_TIME">Full Time</SelectItem>
              <SelectItem value="PART_TIME">Part Time</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="INTERN">Intern</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onReset} title={t("Reset Filters")} className="col-span-2 md:col-span-1 w-full md:w-10 h-9 sm:h-10">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
