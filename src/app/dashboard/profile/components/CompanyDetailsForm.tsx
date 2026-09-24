import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building, Globe, MapPin, PhoneCall } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CompanyDetailsFormProps {
  canEditCompany: boolean;
  companyName: string;
  setCompanyName: (v: string) => void;
  companyWebsite: string;
  setCompanyWebsite: (v: string) => void;
  companyAddress: string;
  setCompanyAddress: (v: string) => void;
  companyPhone: string;
  setCompanyPhone: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export function CompanyDetailsForm({
  canEditCompany,
  companyName,
  setCompanyName,
  companyWebsite,
  setCompanyWebsite,
  companyAddress,
  setCompanyAddress,
  companyPhone,
  setCompanyPhone,
  onSubmit,
  isSaving
}: CompanyDetailsFormProps) {
  const { t } = useTranslation();

  return (
    <div className="border border-primary/10 rounded-xl bg-primary/5 p-5 shadow-sm">
      <div className="mb-4 border-b border-primary/10 pb-3 flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 text-primary rounded-md">
          <Building className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{t("Company Information")}</h3>
          <p className="text-xs text-muted-foreground">{t("Official details of the organization.")}</p>
        </div>
      </div>
      
      {canEditCompany ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                {t("Company Name")}
              </label>
              <Input 
                required 
                placeholder="Enter company name" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)} 
                className="h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                {t("Company Website (Optional)")}
              </label>
              <Input 
                placeholder="Enter website URL" 
                value={companyWebsite} 
                onChange={e => setCompanyWebsite(e.target.value)} 
                className="h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {t("Company Address")}
              </label>
              <Input 
                placeholder="Enter full company address" 
                value={companyAddress} 
                onChange={e => setCompanyAddress(e.target.value)} 
                className="h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                {t("Company Contact No.")}
              </label>
              <Input 
                placeholder="Enter official phone number" 
                value={companyPhone} 
                onChange={e => setCompanyPhone(e.target.value)} 
                className="h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t mt-1">
            <Button type="submit" size="sm" disabled={isSaving} className="px-6 shadow-sm">
              {isSaving ? t("Saving...") : t("Save Company Details")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-muted/50">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <Building className="w-3 h-3" /> Company Name
            </span>
            <span className="text-sm font-semibold text-foreground">{companyName || "N/A"}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <Globe className="w-3 h-3" /> Website
            </span>
            <span className="text-sm">
              {companyWebsite ? (
                <a 
                  href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-primary hover:underline font-medium"
                >
                  {companyWebsite}
                </a>
              ) : <span className="text-foreground">N/A</span>}
            </span>
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <MapPin className="w-3 h-3" /> Address
            </span>
            <span className="text-sm text-foreground block bg-background p-2 rounded-md border mt-1 shadow-sm">
              {companyAddress || "N/A"}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <PhoneCall className="w-3 h-3" /> Contact No.
            </span>
            <span className="text-sm font-medium text-foreground">{companyPhone || "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
