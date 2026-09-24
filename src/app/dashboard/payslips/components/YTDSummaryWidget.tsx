"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PiggyBank, Receipt, Award, TrendingDown } from 'lucide-react';

interface YTDSummaryWidgetProps {
  summary: any;
  loading?: boolean;
}

export function YTDSummaryWidget({ summary, loading }: YTDSummaryWidgetProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 h-[350px] animate-pulse flex flex-col gap-4">
        <div className="w-1/2 h-6 bg-muted rounded mb-2" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b">
            <div className="w-1/3 h-4 bg-muted rounded" />
            <div className="w-1/4 h-5 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const data = [
    { label: "YTD Earnings", value: summary?.ytdEarnings, icon: PiggyBank, color: "text-emerald-600" },
    { label: "YTD Tax", value: summary?.ytdTax, icon: Receipt, color: "text-rose-600" },
    { label: "YTD PF (Provident Fund)", value: summary?.ytdPF, icon: TrendingDown, color: "text-blue-600" },
    { label: "YTD Bonus", value: summary?.ytdBonus, icon: Award, color: "text-amber-600" },
    { label: "Average Monthly Net", value: summary?.averageSalary, icon: PiggyBank, color: "text-emerald-600" },
  ];

  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col h-full shadow-sm hover:border-primary/20 transition-colors">
      <h3 className="text-lg font-semibold mb-4 text-primary">{t("Year to Date Summary")}</h3>
      <div className="flex flex-col flex-1 justify-around">
        {data.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-card transition-colors">
                  <Icon className={cn("w-4 h-4", item.color)} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t(item.label)}</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                ₹{(item.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
