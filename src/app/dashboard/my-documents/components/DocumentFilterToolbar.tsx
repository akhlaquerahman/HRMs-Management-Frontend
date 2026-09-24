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
    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input 
          placeholder={t("Search documents...")}
          className="pl-9 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <Select onValueChange={(v) => onFilterChange('documentType', v)}>
          <SelectTrigger className="w-[160px] bg-white border-gray-200">
            <FileText className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder={t("Document Type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All Document Types")}</SelectItem>
            {documentTypesData && documentTypesData.map((type: any) => (
              <SelectItem key={type.id || type.name} value={type.name}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => onFilterChange('category', v)}>
          <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
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
          <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
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

        <Button variant="ghost" size="sm" onClick={onReset} className="h-10 px-3 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
