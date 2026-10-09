"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Clock, CheckCircle2, UserCheck, CalendarDays, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  statusColor?: string;
}

interface TeamActivityCardProps {
  activities?: ActivityItem[];
  loading?: boolean;
}

export function TeamActivityCard({ activities = [], loading }: TeamActivityCardProps) {
  const { t } = useTranslation();

  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      title: t('Workforce Status Synced'),
      description: t('Today\'s present & absent counts updated'),
      timestamp: new Date(),
      statusColor: 'bg-emerald-500'
    },
    {
      id: '2',
      title: t('Roster Schedule Active'),
      description: t('Weekly team shifts loaded'),
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      statusColor: 'bg-blue-500'
    },
    {
      id: '3',
      title: t('Leave Approvals Ready'),
      description: t('Department leave requests tracked'),
      timestamp: new Date(Date.now() - 3 * 3600 * 1000),
      statusColor: 'bg-amber-500'
    }
  ];

  const items = activities && activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="rounded-2xl border bg-card shadow-xs p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="text-sm font-bold flex items-center gap-2 text-foreground tracking-tight">
          <Activity className="w-4 h-4 text-primary" />
          {t('Recent Team Activity')}
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {t('Live Stream')}
        </span>
      </div>

      <div className="py-3 flex flex-col gap-3 max-h-[220px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-muted"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-2 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : (
          items.slice(0, 5).map((item) => {
            let relativeTime = 'Just now';
            try {
              relativeTime = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
            } catch (e) {}

            return (
              <div key={item.id} className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", item.statusColor || "bg-primary")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-xs text-foreground truncate">{item.title}</h4>
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {relativeTime}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
