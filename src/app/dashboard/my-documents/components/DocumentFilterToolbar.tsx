import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Search, Filter, RefreshCw, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentFilterToolbarProps {
  onSearch: (val: string) => void;
  onFilterChange: (key: string, val: string) => void;
  onReset: () => void;
  showEmployeeFilter?: boolean;
}

export function DocumentFilterToolbar({ 
  onSearch, 
  onFilterChange, 
  onReset,
  showEmployeeFilter = false
}: DocumentFilterToolbarProps) {
  const { t } = useTranslation();

  const { data: documentTypesData } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: async () => {
      const res = await api.get('/documents/types');
      return res.data?.data || [];
    }
  });

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-xl border border-gray-100 dark:border-slate-800 shadow-2xs">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
        <Input 
          placeholder={t("Search documents...")}
          className="pl-8 h-8 sm:h-9 text-xs bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        <Select onValueChange={(v) => onFilterChange('documentType', v)}>
          <SelectTrigger className="w-full sm:w-[150px] h-8 sm:h-9 text-xs bg-white border-gray-200">
            <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
            <SelectValue placeholder={t("Document Type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Types")}</SelectItem>
            {documentTypesData && documentTypesData.map((type: any) => (
              <SelectItem key={type.id || type.name} value={type.name}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => onFilterChange('category', v)}>
          <SelectTrigger className="w-full sm:w-[130px] h-8 sm:h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
            <SelectValue placeholder={t("Category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Categories")}</SelectItem>
            <SelectItem value="IDENTITY">{t("Identity")}</SelectItem>
            <SelectItem value="EMPLOYMENT">{t("Employment")}</SelectItem>
            <SelectItem value="PAYROLL">{t("Payroll")}</SelectItem>
            <SelectItem value="BANK">{t("Bank")}</SelectItem>
            <SelectItem value="EDUCATION">{t("Education")}</SelectItem>
            <SelectItem value="COMPLIANCE">{t("Compliance")}</SelectItem>
            <SelectItem value="MEDICAL">{t("Medical")}</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => onFilterChange('status', v)}>
          <SelectTrigger className="w-full sm:w-[120px] h-8 sm:h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
            <SelectValue placeholder={t("Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Status")}</SelectItem>
            <SelectItem value="VERIFIED">{t("Verified")}</SelectItem>
            <SelectItem value="PENDING">{t("Pending")}</SelectItem>
            <SelectItem value="REJECTED">{t("Rejected")}</SelectItem>
            <SelectItem value="EXPIRING_SOON">{t("Expiring")}</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 sm:h-9 px-2 text-gray-500 hover:text-gray-900 shrink-0 justify-center">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
