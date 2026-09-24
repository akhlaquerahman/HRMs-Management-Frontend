"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface PayrollTimelineWidgetProps {
  activities: any[];
  loading?: boolean;
}

export function PayrollTimelineWidget({ activities, loading }: PayrollTimelineWidgetProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 h-[350px] animate-pulse">
        <div className="w-1/2 h-6 bg-muted rounded mb-6" />
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-muted">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-4 h-4 rounded-full bg-muted mt-1 z-10" />
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-muted rounded mb-2" />
                <div className="w-1/2 h-3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm hover:border-primary/20 transition-colors h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-6 text-primary">{t("Recent Payroll Activities")}</h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent flex-1 overflow-y-auto pr-2">
        {activities?.map((activity: any) => (
          <div key={activity.id} className="relative flex items-start gap-4 group">
            <div className="absolute left-2 -translate-x-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-background border border-muted group-hover:border-primary transition-colors">
              {getIcon(activity.type)}
            </div>
            <div className="pl-6 w-full">
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm">{t(activity.title)}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t(activity.description)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
