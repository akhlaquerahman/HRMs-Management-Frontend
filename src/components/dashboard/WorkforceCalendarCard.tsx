"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  CalendarDays, 
  Info,
  Briefcase,
  Zap,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns';

interface AttendanceRecord {
  id?: string;
  date: string | Date;
  status: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND';
  punchIn?: string;
  punchOut?: string;
  effectiveHours?: number;
  shiftName?: string;
  shiftTiming?: string;
}

interface WorkforceCalendarCardProps {
  attendanceRecords?: any[];
  leaveRequests?: any[];
  holidays?: any[];
  rosterEntries?: any[];
  shiftInfo?: {
    name: string;
    timing: string;
    breakTime: string;
    workingDays: string;
    weeklyOff?: string[];
  };
  isLiveConnected?: boolean;
}

export function WorkforceCalendarCard({ 
  attendanceRecords = [], 
  leaveRequests = [],
  holidays = [],
  rosterEntries = [],
  shiftInfo = {
    name: 'General Day Shift',
    timing: '09:00 AM - 06:00 PM',
    breakTime: '01:00 PM - 02:00 PM (1 Hour)',
    workingDays: 'Monday to Friday',
    weeklyOff: ['Saturday', 'Sunday']
  },
  isLiveConnected = true
}: WorkforceCalendarCardProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    status: string;
    punchIn?: string;
    punchOut?: string;
    hours?: number;
    assignedShift?: any;
  } | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const resetToToday = () => setCurrentMonth(new Date());

  const weeklyOffSet = new Set(shiftInfo?.weeklyOff || ['Saturday', 'Sunday']);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Helper for UTC-safe date key
  const toYYYYMMDD = (val: string | Date): string => {
    if (typeof val === 'string') return val.split('T')[0];
    if (val instanceof Date) {
      const yyyy = val.getUTCFullYear();
      const mm = String(val.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(val.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  };

  // Map attendance records by YYYY-MM-DD
  const attendanceMap = new Map<string, any>();
  attendanceRecords.forEach(rec => {
    if (rec.date) {
      attendanceMap.set(toYYYYMMDD(rec.date), rec);
    }
  });

  // Map published/assigned roster entries by YYYY-MM-DD
  const rosterMap = new Map<string, any>();
  rosterEntries.forEach(r => {
    if (r.date) {
      rosterMap.set(toYYYYMMDD(r.date), r);
    }
  });

  // Map holidays by YYYY-MM-DD
  const holidayMap = new Map<string, any>();
  holidays.forEach(h => {
    if (h.date) {
      holidayMap.set(toYYYYMMDD(h.date), h);
    }
  });

  // Map approved leave requests by YYYY-MM-DD range
  const leaveSet = new Set<string>();
  leaveRequests.forEach(l => {
    if (l.startDate && l.endDate) {
      let cur = new Date(l.startDate);
      const end = new Date(l.endDate);
      while (cur <= end) {
        leaveSet.add(format(cur, 'yyyy-MM-dd'));
        cur.setDate(cur.getDate() + 1);
      }
    }
  });

  // Build grid days
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    }
    rows.push(days);
    days = [];
  }

  // Monthly summary stats
  let presentCount = 0;
  let leaveCount = 0;
  let totalWorkDays = 0;

  rows.forEach(week => {
    week.forEach(d => {
      if (isSameMonth(d, currentMonth)) {
        const dayName = dayNames[d.getDay()];
        const isWeeklyOff = weeklyOffSet.has(dayName);
        if (!isWeeklyOff) totalWorkDays++;

        const dateKey = format(d, 'yyyy-MM-dd');
        const record = attendanceMap.get(dateKey);
        const isLeave = leaveSet.has(dateKey) || record?.status === 'APPROVED' || record?.status === 'ON_LEAVE';
        if (record?.status === 'PRESENT') presentCount++;
        if (isLeave) leaveCount++;
      }
    });
  });

  return (
    <div className="rounded-2xl border bg-card shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      
      {/* Top Banner: Header + Shift Policy Bar */}
      <div className="p-5 border-b bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>{t("Shift & Attendance Calendar")}</span>
                <Badge variant="outline" className={`text-[10px] font-bold ${
                  isLiveConnected 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' 
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${isLiveConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  {isLiveConnected ? 'Live Real-Time Roster' : 'Roster Active'}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("View your monthly shift schedule, working days, and attendance logs")}
              </p>
            </div>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button size="sm" variant="outline" onClick={resetToToday} className="h-8 text-xs font-semibold px-2.5">
              {t("Today")}
            </Button>
            <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold font-mono text-foreground min-w-[110px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Working Shift Info Bar */}
        <div className="mt-4 pt-3 border-t grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border">
            <Briefcase className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-foreground block truncate">{shiftInfo.name}</span>
              <span className="text-[11px] text-muted-foreground">{shiftInfo.timing}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-foreground block truncate">Lunch & Break</span>
              <span className="text-[11px] text-muted-foreground">{shiftInfo.breakTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border">
            <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-foreground block truncate">Working Days</span>
              <span className="text-[11px] text-muted-foreground">{shiftInfo.workingDays}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend Header */}
      <div className="px-5 py-2.5 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-foreground font-semibold">Present</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-foreground font-semibold">Scheduled Shift</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-foreground font-semibold">On Leave</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-foreground font-semibold">Holiday</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-muted-foreground">Weekend / Off</span>
          </span>
        </div>

        <div className="text-muted-foreground font-mono text-[11px]">
          Target: <strong className="text-foreground">{totalWorkDays} Working Days</strong>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
              <div key={d} className={`py-1 ${i >= 5 ? 'text-amber-600/80' : ''}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Month Days Matrix */}
          <div className="space-y-1.5">
            {rows.map((week, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-1.5">
                {week.map((d, dIdx) => {
                  const isCurrentMonth = isSameMonth(d, currentMonth);
                  const isCurrentDay = isToday(d);
                  const dayName = dayNames[d.getDay()];
                  const isWeekend = weeklyOffSet.has(dayName);
                  const dateKey = format(d, 'yyyy-MM-dd');
                  const record = attendanceMap.get(dateKey);
                  const holidayItem = holidayMap.get(dateKey);

                  const rosterItem = rosterMap.get(dateKey);
                  const assignedShift = rosterItem?.shift;
                  const isRosterWeekOff = rosterItem?.type === 'WEEK_OFF' || rosterItem?.type === 'OFF';
                  const isRosterLeave = rosterItem?.type === 'LEAVE';
                  const isRosterHoliday = rosterItem?.type === 'HOLIDAY';
                  const isRosterWFH = rosterItem?.type === 'WFH';

                  const isPresent = record?.status === 'PRESENT';
                  const isLeave = leaveSet.has(dateKey) || record?.status === 'APPROVED' || record?.status === 'ON_LEAVE' || isRosterLeave;
                  const isHoliday = !!holidayItem || record?.status === 'HOLIDAY' || isRosterHoliday;

                  let bgClass = "bg-card border-slate-200 dark:border-slate-800 hover:border-blue-400";
                  let statusBadge = null;

                  if (!isCurrentMonth) {
                    bgClass = "bg-muted/10 border-transparent opacity-30 cursor-default";
                  } else if (isPresent) {
                    bgClass = "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/70";
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white truncate max-w-full">
                        {record.effectiveHours ? `${Number(record.effectiveHours).toFixed(1)}h` : 'PUNCHED'}
                      </span>
                    );
                  } else if (isLeave) {
                    bgClass = "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800";
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white truncate max-w-full">
                        LEAVE
                      </span>
                    );
                  } else if (isHoliday) {
                    bgClass = "bg-purple-50/70 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800";
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white truncate max-w-full" title={holidayItem?.name}>
                        {holidayItem?.name ? holidayItem.name.slice(0, 10) : 'HOLIDAY'}
                      </span>
                    );
                  } else if (isRosterWeekOff || isWeekend) {
                    bgClass = "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold";
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-white truncate max-w-full">
                        OFF
                      </span>
                    );
                  } else if (isRosterWFH) {
                    bgClass = "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800";
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white truncate max-w-full">
                        WFH
                      </span>
                    );
                  } else if (assignedShift) {
                    bgClass = "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400";
                    statusBadge = (
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 truncate" title={assignedShift.name}>
                          {assignedShift.name}
                        </span>
                        <span className="text-[9px] font-mono text-indigo-600/80 dark:text-indigo-400/80">
                          {assignedShift.startTime} - {assignedShift.endTime}
                        </span>
                      </div>
                    );
                  } else if (d < new Date()) {
                    // Past working day without punch
                    bgClass = "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800";
                    statusBadge = (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {shiftInfo.timing}
                      </span>
                    );
                  } else {
                    // Default future scheduled shift
                    bgClass = "bg-blue-50/40 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/40";
                    statusBadge = (
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        {shiftInfo.name}
                      </span>
                    );
                  }

                  return (
                    <div
                      key={dateKey}
                      onClick={() => {
                        if (!isCurrentMonth) return;
                        setSelectedDay({
                          date: d,
                          status: isPresent ? 'PRESENT' : isLeave ? 'LEAVE' : isHoliday ? 'HOLIDAY' : isWeekend ? 'WEEKEND' : 'SCHEDULED',
                          punchIn: record?.logs?.[0]?.punchIn ? format(new Date(record.logs[0].punchIn), 'hh:mm a') : isPresent ? '09:05 AM' : undefined,
                          punchOut: record?.logs?.[0]?.punchOut ? format(new Date(record.logs[0].punchOut), 'hh:mm a') : isPresent ? '06:05 PM' : undefined,
                          hours: record?.effectiveHours || (isPresent ? 8.5 : 0)
                        });
                      }}
                      className={`min-h-[72px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none ${bgClass} ${
                        isCurrentDay ? 'ring-2 ring-primary ring-offset-1 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono font-bold ${
                          isCurrentDay ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {format(d, 'd')}
                        </span>
                        {isCurrentDay && (
                          <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1 rounded">
                            TODAY
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-col gap-0.5">
                        {statusBadge}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer KPI Summary Bar */}
      <div className="p-4 border-t bg-muted/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div className="p-2.5 rounded-xl bg-card border shadow-2xs">
          <span className="text-muted-foreground text-[11px] block">{t("Present Days")}</span>
          <span className="text-base font-extrabold text-emerald-600 font-mono">{presentCount} Days</span>
        </div>
        <div className="p-2.5 rounded-xl bg-card border shadow-2xs">
          <span className="text-muted-foreground text-[11px] block">{t("Leaves Taken")}</span>
          <span className="text-base font-extrabold text-amber-600 font-mono">{leaveCount} Days</span>
        </div>
        <div className="p-2.5 rounded-xl bg-card border shadow-2xs">
          <span className="text-muted-foreground text-[11px] block">{t("Working Days")}</span>
          <span className="text-base font-extrabold text-foreground font-mono">{totalWorkDays} Days</span>
        </div>
        <div className="p-2.5 rounded-xl bg-card border shadow-2xs">
          <span className="text-muted-foreground text-[11px] block">{t("Assigned Shift")}</span>
          <span className="text-base font-extrabold text-blue-600 truncate block">General (9-6)</span>
        </div>
      </div>

      {/* Detailed Shift & Attendance Day Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        {selectedDay && (
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span>{format(selectedDay.date, 'EEEE, dd MMMM yyyy')}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Roster details and attendance breakdown for this date.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground">Attendance Status</span>
                <Badge className={
                  selectedDay.status === 'PRESENT' ? 'bg-emerald-600' :
                  selectedDay.status === 'LEAVE' ? 'bg-amber-600' :
                  selectedDay.status === 'HOLIDAY' ? 'bg-purple-600' :
                  selectedDay.status === 'WEEKEND' ? 'bg-slate-600' : 'bg-blue-600'
                }>
                  {selectedDay.status}
                </Badge>
              </div>

              {/* Shift Information */}
              <div className="space-y-2 border rounded-xl p-3">
                <span className="text-xs font-bold text-foreground block border-b pb-1">Assigned Working Shift</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Shift Name</span>
                    <span className="font-semibold text-foreground">{shiftInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Timing</span>
                    <span className="font-semibold text-foreground">{shiftInfo.timing}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Break</span>
                    <span className="font-semibold text-foreground">1 Hour</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Location</span>
                    <span className="font-semibold text-foreground">Main Office</span>
                  </div>
                </div>
              </div>

              {/* Punch Logs if Present */}
              {selectedDay.status === 'PRESENT' && (
                <div className="space-y-2 border rounded-xl p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block border-b border-emerald-200 pb-1">Punch Log Details</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Punch In</span>
                      <span className="font-bold text-foreground">{selectedDay.punchIn || '09:00 AM'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Punch Out</span>
                      <span className="font-bold text-foreground">{selectedDay.punchOut || '06:00 PM'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Effective Hrs</span>
                      <span className="font-bold text-emerald-600 font-mono">{selectedDay.hours || 8.5} hrs</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDay(null)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
