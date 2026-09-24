"use client";

import React from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Wallet, Banknote, CheckCircle, Award, TrendingDown, Receipt, FileText, Clock, Loader2 } from 'lucide-react';

interface PayrollKPICardsProps {
  metrics: any[];
  loading?: boolean;
}

export function PayrollKPICards({ metrics, loading }: PayrollKPICardsProps) {
  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading payroll metrics...</p>
      </div>
    );
  }

  const getIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'Wallet': return Wallet;
      case 'Banknote': return Banknote;
      case 'CheckCircle': return CheckCircle;
      case 'Award': return Award;
      case 'TrendingDown': return TrendingDown;
      case 'Receipt': return Receipt;
      case 'FileText': return FileText;
      case 'Clock': return Clock;
      default: return Wallet;
    }
  };

  const getColorClasses = (title: string) => {
    if (title.includes('Deduction') || title.includes('Tax')) {
      return { color: "text-rose-600", bg: "bg-rose-100", cardBg: "bg-rose-50/50" };
    }
    if (title.includes('Bonus') || title.includes('Rewards')) {
      return { color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" };
    }
    if (title.includes('Net Salary') || title.includes('Total Salary')) {
      return { color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" };
    }
    return { color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" };
  };

  return (
    <div className="grid gap-6 grid-cols-2 md:grid-cols-6 ">
      {metrics?.map((metric: any, i: number) => {
        const { color, bg, cardBg } = getColorClasses(metric.title);
        return (
          <KPICard 
            key={i} 
            title={metric.title} 
            value={metric.value} 
            trend={metric.subtitle}
            icon={getIcon(metric.icon)}
            colorClass={color}
            bgClass={bg}
            cardBgClass={cardBg}
          />
        );
      })}
    </div>
  );
}
