"use client";

import React from 'react';
import { format } from 'date-fns';
import { Palmtree, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaveCalendarProps {
  data: any;
  loading?: boolean;
}

export function LeaveCalendar({ data, loading }: LeaveCalendarProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 min-h-[300px] animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-6" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted/40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const { upcomingLeaves = [], holidays = [] } = data || {};
  
  // Combine and sort events
  const events = [
    ...upcomingLeaves.map((l: any) => ({ ...l, isHoliday: false })),
    ...holidays.map((h: any) => ({ ...h, isHoliday: true, startDate: h.date }))
  ].sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 8);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 flex flex-col items-center justify-center text-center">
        <Palmtree className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Clear Schedule</h3>
        <p className="text-sm text-muted-foreground">No upcoming leaves or holidays.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-6 text-primary">Calendar & Schedule</h3>
      
      <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[400px]">
        {events.map((event: any, i: number) => {
          const isHoliday = event.isHoliday;
          
          return (
            <div key={i} className="flex gap-4 p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors group">
              <div className={cn(
                "w-12 h-12 rounded-lg shrink-0 flex flex-col items-center justify-center border",
                isHoliday ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-blue-50 text-blue-600 border-blue-200"
              )}>
                <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                  {format(new Date(event.startDate), 'MMM')}
                </span>
                <span className="text-lg font-bold leading-none mt-1">
                  {format(new Date(event.startDate), 'dd')}
                </span>
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {isHoliday ? event.name : `${event.employee?.firstName} ${event.employee?.lastName}`}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {isHoliday ? (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Holiday</span>
                  ) : (
                    <>
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" /> {event.leaveType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        until {format(new Date(event.endDate), 'MMM dd')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
