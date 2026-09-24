import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle, AlertCircle, Clock, Database, UploadCloud, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { KPICard } from '@/components/dashboard/KPICard';

export function DocumentKPICards({ metrics, loading }: { metrics: any, loading: boolean }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading document metrics...</p>
      </div>
    );
  }

  const kpis = [
    { label: "Total Documents", value: metrics?.total || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" },
    { label: "Verified", value: metrics?.verified || 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" },
    { label: "Pending", value: metrics?.pending || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" },
    { label: "Expiring Soon", value: metrics?.expiring || 0, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-100", cardBg: "bg-rose-50/50" },
    { label: "Storage Used", value: metrics?.storageFormatted || "0 MB", icon: Database, color: "text-purple-600", bg: "bg-purple-100", cardBg: "bg-purple-50/50" },
    { label: "Last Upload", value: metrics?.lastUpload ? formatDistanceToNow(new Date(metrics.lastUpload), { addSuffix: true }) : "Never", icon: UploadCloud, color: "text-slate-600", bg: "bg-slate-100", cardBg: "bg-slate-50/50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      {kpis.map((kpi, i) => (
        <KPICard 
          key={i} 
          title={t(kpi.label)} 
          value={kpi.value} 
          icon={kpi.icon}
          colorClass={kpi.color}
          bgClass={kpi.bg}
          cardBgClass={kpi.cardBg}
        />
      ))}
    </div>
  );
}
