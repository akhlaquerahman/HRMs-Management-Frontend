import React from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BankDetailsFormProps {
  bankName: string;
  setBankName: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export function BankDetailsForm({
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  onSubmit,
  isSaving
}: BankDetailsFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="border border-blue-500/10 rounded-xl bg-blue-500/5 p-5 shadow-sm h-full flex flex-col">
      <div className="mb-4 border-b border-blue-500/10 pb-3 flex items-center gap-2 shrink-0">
        <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md">
          <Landmark className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{t("Bank Information")}</h3>
          <p className="text-xs text-muted-foreground">{t("Details for salary processing.")}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
            {t("Bank Name")}
          </label>
          <Input 
            value={bankName} 
            onChange={e => setBankName(e.target.value)} 
            placeholder="e.g. HDFC Bank"
            className="h-9"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
            {t("Account Number")}
          </label>
          <Input 
            value={accountNumber} 
            onChange={e => setAccountNumber(e.target.value)} 
            placeholder="Enter account number"
            type="text"
            className="h-9"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end shrink-0 pt-4 border-t border-blue-500/10">
        <Button type="submit" disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? t("Saving...") : t("Update Bank Details")}
        </Button>
      </div>
    </form>
  );
}
