import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX, CalendarDays, UserPlus, Clock, Loader2 } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Skeleton } from '@/components/ui/skeleton';

export function WorkforceKPICards({ data, loading }: { data: any, loading: boolean }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex flex-col gap-2 p-4 border rounded-xl bg-card shadow-sm h-[100px]">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    { label: "Total Employees", value: data?.total || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" },
    { label: "Active", value: data?.active || 0, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" },
    { label: "Inactive", value: data?.inactive || 0, icon: UserX, color: "text-rose-600", bg: "bg-rose-100", cardBg: "bg-rose-50/50" },
    { label: "On Leave", value: data?.onLeave || 0, icon: CalendarDays, color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" },
    { label: "New Joiners", value: data?.newJoiners || 0, icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-100", cardBg: "bg-indigo-50/50" },
    { label: "Probation", value: data?.onProbation || 0, icon: Clock, color: "text-purple-600", bg: "bg-purple-100", cardBg: "bg-purple-50/50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
