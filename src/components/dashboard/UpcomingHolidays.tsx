"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Palmtree, CalendarDays } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface UpcomingHolidaysProps {
  holidays: Holiday[];
  loading?: boolean;
}

export function UpcomingHolidays({ holidays, loading }: UpcomingHolidaysProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Palmtree className="w-5 h-5 text-primary" />
          {t('Upcoming Holidays')}
        </h3>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar flex-1">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 animate-pulse border">
              <div className="w-12 h-12 rounded-lg bg-muted shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : holidays?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground h-full">
            <CalendarDays className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">{t('No upcoming holidays.')}</p>
          </div>
        ) : (
          holidays?.map(holiday => {
            const daysAway = differenceInDays(new Date(holiday.date), new Date());
            const isSoon = daysAway <= 7 && daysAway >= 0;
            
            return (
              <div key={holiday.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className={cn(
                  "w-12 h-12 rounded-lg shrink-0 flex flex-col items-center justify-center border",
                  isSoon ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                    {format(new Date(holiday.date), 'MMM')}
                  </span>
                  <span className="text-lg font-bold leading-none mt-1">
                    {format(new Date(holiday.date), 'dd')}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {holiday.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {holiday.type}
                    </span>
                    <span className={cn(
                      "text-xs font-medium",
                      isSoon ? "text-primary" : "text-muted-foreground"
                    )}>
                      {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
