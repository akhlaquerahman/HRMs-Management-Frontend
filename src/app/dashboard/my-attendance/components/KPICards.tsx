"use client";

import { Clock, UserCheck, UserX, AlertCircle, CalendarRange, Timer, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export function KPICards({ summaryData, summaryLoading }: { summaryData: any, summaryLoading: boolean }) {
  if (summaryLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-[100px] bg-card rounded-xl border shadow-sm animate-pulse" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Present Days",
      value: summaryData?.presentDays || 0,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-100/80",
      cardBg: "bg-card",
      trend: "+2% vs last month"
    },
    {
      title: "Absent Days",
      value: summaryData?.absentDays || 0,
      icon: UserX,
      color: "text-rose-600",
      bg: "bg-rose-100/80",
      cardBg: "bg-card",
      trend: "-1% vs last month"
    },
    {
      title: "Late Arrivals",
      value: summaryData?.lateArrivals || 0,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-100/80",
      cardBg: "bg-card",
      trend: "Same as last month"
    },
    {
      title: "Working Hours",
      value: `${summaryData?.totalWorkingHours || 0}h`,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-100/80",
      cardBg: "bg-card",
      trend: "+5h vs last month"
    },
    {
      title: "Overtime",
      value: `${summaryData?.totalOvertimeHours || 0}h`,
      icon: Timer,
      color: "text-purple-600",
      bg: "bg-purple-100/80",
      cardBg: "bg-card",
      trend: "-2h vs last month"
    },
    {
      title: "Remaining Leaves",
      value: summaryData?.remainingLeaves || 12,
      icon: CalendarRange,
      color: "text-indigo-600",
      bg: "bg-indigo-100/80",
      cardBg: "bg-card",
      trend: "Total 12 annual"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi, idx) => (
        <div 
          key={idx} 
          className={cn(
            "rounded-xl border shadow-sm p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all cursor-default overflow-hidden", 
            kpi.cardBg
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{kpi.title}</span>
            <div className={cn("p-2 rounded-lg shrink-0", kpi.bg, kpi.color)}>
              <kpi.icon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">{kpi.value}</h3>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">{kpi.trend}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
