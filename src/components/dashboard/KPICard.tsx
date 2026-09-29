import React from 'react';
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';

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
  
  const stringVal = String(value ?? '');
  const isStatusBadge = stringVal.length > 7 || stringVal.includes('PUNCHED') || stringVal.includes('CHECKED') || stringVal.includes('WORKING') || stringVal.includes('BREAK');

  return (
    <div className={cn(
      "relative rounded-2xl border p-3.5 sm:p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group overflow-hidden min-w-0 min-h-[115px] sm:min-h-[125px]",
      cardBgClass
    )}>
      {/* Top Section */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span 
          className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-tight truncate group-hover:text-foreground transition-colors min-w-0"
          title={title}
        >
          {title}
        </span>
        <div className={cn("p-2 sm:p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105 shadow-xs", bgClass, colorClass)}>
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-2">
        <div className="flex items-center justify-between gap-1.5 flex-wrap min-w-0">
          {isStatusBadge ? (
            <span className={cn(
              "text-[11px] sm:text-xs font-extrabold tracking-tight px-2.5 py-1 rounded-lg border leading-tight uppercase shadow-2xs truncate max-w-full my-0.5",
              stringVal.includes("NOT") || stringVal.includes("ABSENT") 
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/80"
                : stringVal.includes("PUNCHED") || stringVal.includes("PRESENT")
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/80"
                : "bg-primary/10 text-primary border-primary/20"
            )}
            title={stringVal}
            >
              {stringVal.replace(/_/g, ' ')}
            </span>
          ) : (
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors font-mono truncate">
              {value}
            </h3>
          )}

          {trend && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
              isPositiveTrend ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50" : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50"
            )}>
              {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] font-medium text-muted-foreground mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
