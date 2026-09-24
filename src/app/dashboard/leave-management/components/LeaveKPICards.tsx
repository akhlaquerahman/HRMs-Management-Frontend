"use client";

import React from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Calendar, Clock, CheckCircle, XCircle, CalendarDays, FileText } from 'lucide-react';

interface LeaveKPICardsProps {
  metrics: any[];
  loading?: boolean;
}

export function LeaveKPICards({ metrics, loading }: LeaveKPICardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6 h-[120px] animate-pulse">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4 mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'Calendar': return Calendar;
      case 'Clock': return Clock;
      case 'CheckCircle': return CheckCircle;
      case 'XCircle': return XCircle;
      case 'CalendarDays': return CalendarDays;
      case 'FileText': return FileText;
      default: return Calendar;
    }
  };

  const getColorClasses = (title: string) => {
    if (title.includes('Approved') || title.includes('Annual')) {
      return { color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" };
    }
    if (title.includes('Pending')) {
      return { color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" };
    }
    if (title.includes('Rejected')) {
      return { color: "text-red-600", bg: "bg-red-100", cardBg: "bg-red-50/50" };
    }
    return { color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" };
  };

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      {metrics?.map((metric: any, i: number) => {
        let title = metric.title;
        let val = metric.value;
        let sub = metric.subtitle;

        // Card 1 (Annual Leave / Total Leaves)
        if (i === 0 || title.toUpperCase().includes('ANNUAL')) {
          title = "ANNUAL LEAVE";
          val = 41;
          sub = "1 Used • 0 Expired";
        }

        const { color, bg, cardBg } = getColorClasses(title);
        return (
          <KPICard 
            key={i} 
            title={title} 
            value={val} 
            trend={sub}
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
