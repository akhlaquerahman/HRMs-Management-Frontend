import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Calendar, Gift, CheckCircle } from 'lucide-react';

export function WorkforceInsightsStrip({ data, loading }: { data: any, loading: boolean }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="w-full bg-muted/20 border-border/50 border rounded-lg p-3 animate-pulse h-12" />
    );
  }

  return (
    <div className="w-full bg-blue-50/50 border-blue-100 border rounded-lg p-3 flex flex-wrap items-center gap-4 text-sm text-blue-900 shadow-sm">
      <div className="flex items-center font-semibold text-blue-700">
        <Sparkles className="w-4 h-4 mr-1.5" />
        {t("Quick Insights")}
      </div>
      
      <div className="w-px h-4 bg-blue-200 hidden md:block"></div>
      
      <div className="flex items-center gap-1.5">
        <UserIcon className="w-3.5 h-3.5 opacity-70" />
        <span>{data?.newJoiners || 0} {t("employees joined this month.")}</span>
      </div>
      
      <div className="w-px h-4 bg-blue-200 hidden md:block"></div>
      
      <div className="flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5 opacity-70" />
        <span>{data?.onProbation || 0} {t("employees currently on probation.")}</span>
      </div>
      
      <div className="w-px h-4 bg-blue-200 hidden md:block"></div>
      
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 opacity-70" />
        <span>{data?.onLeave || 0} {t("employees on leave today.")}</span>
      </div>
    </div>
  );
}

// Temporary internal component
function UserIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
