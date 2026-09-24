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
  return (
    <div className={cn("rounded-xl border shadow-sm p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all cursor-default flex-1 overflow-hidden", cardBgClass)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight truncate">{title}</span>
        <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", bgClass, colorClass)}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">{value}</h3>
        {trend && <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">{trend}</p>}
        {subtitle && <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
