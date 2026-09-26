import React from 'react';
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  cardBgClass?: string;
  trend?: string;
  subtitle?: string;
}

export function KPICard({ title, value, icon: Icon, colorClass, bgClass, cardBgClass = "bg-card", trend, subtitle }: KPICardProps) {
  const isPositiveTrend = trend?.includes('+') || trend?.toLowerCase().includes('active') || trend?.toLowerCase().includes('healthy');

  return (
    <div className={cn(
      "relative rounded-2xl border bg-card p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-default group overflow-hidden",
      cardBgClass
    )}>
      {/* Top Section */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate group-hover:text-foreground transition-colors">
          {title}
        </span>
        <div className={cn("p-2 sm:p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 shadow-xs", bgClass, colorClass)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {value}
          </h3>
          {trend && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0",
              isPositiveTrend ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50" : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50"
            )}>
              {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
