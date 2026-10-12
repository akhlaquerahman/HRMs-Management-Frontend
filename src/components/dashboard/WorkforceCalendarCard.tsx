"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Briefcase, 
  CalendarDays, 
  MapPin, 
  UserCheck, 
  UserX, 
  AlertCircle
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
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns';

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
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'SCHEDULED';
    statusLabel: string;
    punchIn?: string;
    punchOut?: string;
    hours?: number;
    shiftName: string;
    shiftTiming: string;
    note?: string;
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

  // Bulletproof Multi-Format Date Key Generator (Matches UTC, Local, and Date string splits)
  const getDateKeys = (val: string | Date | undefined | null): string[] => {
    if (!val) return [];
    const keys = new Set<string>();
    if (typeof val === 'string') {
      const trimmed = val.split('T')[0];
      if (trimmed) keys.add(trimmed);
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      keys.add(format(d, 'yyyy-MM-dd'));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      keys.add(`${yyyy}-${mm}-${dd}`);

      const uyyyy = d.getUTCFullYear();
      const umm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const udd = String(d.getUTCDate()).padStart(2, '0');
      keys.add(`${uyyyy}-${umm}-${udd}`);
    }
    return Array.from(keys);
  };

  // Map attendance records
  const attendanceMap = new Map<string, any>();
  (attendanceRecords || []).forEach(rec => {
    if (rec?.date) {
      getDateKeys(rec.date).forEach(k => attendanceMap.set(k, rec));
    }
  });

  // Map published roster entries
  const rosterMap = new Map<string, any>();
  (rosterEntries || []).forEach(r => {
    if (r?.date) {
      getDateKeys(r.date).forEach(k => rosterMap.set(k, r));
    }
  });

  // Map holidays
  const holidayMap = new Map<string, any>();
  (holidays || []).forEach(h => {
    if (h?.date) {
      getDateKeys(h.date).forEach(k => holidayMap.set(k, h));
    }
  });

  // Map approved leave requests
  const leaveMap = new Map<string, any>();
  (leaveRequests || []).forEach(l => {
    if (l?.startDate && l?.endDate) {
      let cur = new Date(l.startDate);
      const end = new Date(l.endDate);
      while (cur <= end) {
        getDateKeys(cur).forEach(k => leaveMap.set(k, l));
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
  let absentCount = 0;
  let leaveCount = 0;
  let totalWorkDays = 0;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  rows.forEach(week => {
    week.forEach(d => {
      if (isSameMonth(d, currentMonth)) {
        const dayName = dayNames[d.getDay()];
        const isWeeklyOff = weeklyOffSet.has(dayName);
        if (!isWeeklyOff) totalWorkDays++;

        const dNorm = new Date(d);
        dNorm.setHours(0, 0, 0, 0);
        const isPast = dNorm < todayDate;

        const dateKeys = getDateKeys(d);
        let record: any = null;
        for (const k of dateKeys) {
          if (attendanceMap.has(k)) { record = attendanceMap.get(k); break; }
        }
        let rosterItem: any = null;
        for (const k of dateKeys) {
          if (rosterMap.has(k)) { rosterItem = rosterMap.get(k); break; }
        }
        let holidayItem: any = null;
        for (const k of dateKeys) {
          if (holidayMap.has(k)) { holidayItem = holidayMap.get(k); break; }
        }
        let leaveItem: any = null;
        for (const k of dateKeys) {
          if (leaveMap.has(k)) { leaveItem = leaveMap.get(k); break; }
        }

        const isRosterWeekOff = rosterItem?.type === 'WEEK_OFF' || rosterItem?.type === 'OFF';
        const isOff = isRosterWeekOff || (isWeeklyOff && !rosterItem?.shift);
        const isHoliday = !!holidayItem || record?.status === 'HOLIDAY' || rosterItem?.type === 'HOLIDAY';
        const isLeave = !!leaveItem || record?.status === 'APPROVED' || record?.status === 'ON_LEAVE' || record?.status === 'LEAVE';
        const isPresent = record?.status === 'PRESENT' || (record?.logs && record.logs.length > 0 && record.effectiveHours > 0);
        const isHalfDay = record?.status === 'HALF_DAY';

        if (isPresent) {
          presentCount++;
        } else if (isHalfDay) {
          presentCount += 0.5;
        } else if (isLeave) {
          leaveCount++;
        } else if (isPast && !isOff && !isHoliday) {
          absentCount++;
        }
      }
    });
  });

  return (
    <div className="rounded-xl sm:rounded-2xl border bg-card shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden w-full max-w-full min-w-0">
      
      {/* Top Banner: Header + Shift Policy Bar */}
      <div className="p-2.5 sm:p-5 border-b bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-primary/10 text-primary shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="truncate">{t("Shift & Attendance Calendar")}</span>
                <Badge variant="outline" className={`text-[8.5px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.2 shrink-0 ${
                  isLiveConnected 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' 
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 ${isLiveConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  {isLiveConnected ? 'Live Roster' : 'Active'}
                </Badge>
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                {t("View your monthly shift schedule, working days, and attendance logs")}
              </p>
            </div>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-1 sm:gap-2 self-start sm:self-center">
            <Button size="sm" variant="outline" onClick={resetToToday} className="h-6 sm:h-8 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5">
              {t("Today")}
            </Button>
            <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
              <button
                onClick={prevMonth}
                className="p-1 sm:p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <span className="px-1.5 sm:px-3 text-[10px] sm:text-xs font-bold font-mono text-foreground min-w-[76px] sm:min-w-[110px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 sm:p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: Assigned Working Shift Info Bar */}
        <div className="hidden sm:grid mt-4 pt-3 border-t grid-cols-3 gap-2.5 text-xs text-muted-foreground">
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

        {/* Mobile: Ultra-Clean Compact Shift Chip */}
        <div className="sm:hidden mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] bg-muted/30 px-2 py-1 rounded-md border min-w-0 max-w-full">
          <div className="flex items-center gap-1 min-w-0 truncate">
            <Briefcase className="w-3 h-3 text-primary shrink-0" />
            <span className="font-bold text-foreground truncate">{shiftInfo.name}</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground shrink-0 ml-2">{shiftInfo.timing}</span>
        </div>
      </div>

      {/* Enterprise Legend Header */}
      <div className="px-2 sm:px-5 py-1.5 sm:py-2.5 border-b bg-muted/20 flex items-center justify-between gap-2 text-[9px] sm:text-[11px] font-medium overflow-x-auto no-scrollbar custom-scrollbar w-full min-w-0 max-w-full">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 whitespace-nowrap">
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900" />
            <span className="text-foreground font-semibold">Present (P)</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900" />
            <span className="text-foreground font-semibold">Absent (A)</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900" />
            <span className="text-foreground font-semibold">Leave (L)</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-600 ring-2 ring-amber-300 dark:ring-amber-800" />
            <span className="text-foreground font-semibold">Half Day (HD)</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-200 dark:ring-purple-900" />
            <span className="text-foreground font-semibold">Holiday (H)</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900" />
            <span className="text-foreground font-semibold">Scheduled</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span className="text-muted-foreground">Week Off</span>
          </span>
        </div>

        <div className="text-muted-foreground font-mono text-[9px] sm:text-[11px] shrink-0 hidden md:block">
          Target: <strong className="text-foreground">{totalWorkDays} Working Days</strong>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-1 sm:p-4 w-full min-w-0 max-w-full overflow-hidden">
        <div className="w-full min-w-0">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5 mb-1 sm:mb-2 text-center text-[9px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider w-full min-w-0">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
              <div key={d} className={`min-w-0 py-0.5 sm:py-1 ${i >= 5 ? 'text-amber-600/90 font-extrabold' : ''}`}>
                <span className="sm:hidden">{d.charAt(0)}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
          </div>

          {/* Month Days Matrix */}
          <div className="space-y-0.5 sm:space-y-1.5 w-full min-w-0">
            {rows.map((week, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-0.5 sm:gap-1.5 w-full min-w-0">
                {week.map((d, dIdx) => {
                  const isCurrentMonth = isSameMonth(d, currentMonth);
                  const isCurrentDay = isToday(d);
                  const dayName = dayNames[d.getDay()];
                  const isDefaultWeekend = weeklyOffSet.has(dayName);

                  const dNorm = new Date(d);
                  dNorm.setHours(0, 0, 0, 0);
                  const isPast = dNorm < todayDate;

                  const dateKeys = getDateKeys(d);
                  let record: any = null;
                  for (const k of dateKeys) {
                    if (attendanceMap.has(k)) { record = attendanceMap.get(k); break; }
                  }
                  let rosterItem: any = null;
                  for (const k of dateKeys) {
                    if (rosterMap.has(k)) { rosterItem = rosterMap.get(k); break; }
                  }
                  let holidayItem: any = null;
                  for (const k of dateKeys) {
                    if (holidayMap.has(k)) { holidayItem = holidayMap.get(k); break; }
                  }
                  let leaveItem: any = null;
                  for (const k of dateKeys) {
                    if (leaveMap.has(k)) { leaveItem = leaveMap.get(k); break; }
                  }

                  const isRosterWeekOff = rosterItem?.type === 'WEEK_OFF' || rosterItem?.type === 'OFF';
                  const isWeekendOrOff = isRosterWeekOff || (isDefaultWeekend && !rosterItem?.shift);

                  // Shift resolution
                  const effectiveShift = rosterItem?.shift || record?.shift || (isWeekendOrOff ? null : shiftInfo);
                  const shiftDisplayTiming = effectiveShift?.timing || 
                    (effectiveShift?.startTime && effectiveShift?.endTime ? `${effectiveShift.startTime} - ${effectiveShift.endTime}` : shiftInfo?.timing || '09:00 - 18:00');
                  const shiftDisplayName = effectiveShift?.name || shiftInfo?.name || 'General Shift';

                  // Attendance status resolution
                  const isPresent = record?.status === 'PRESENT' || 
                    (record?.logs && record.logs.length > 0 && (record.effectiveHours > 0 || isCurrentDay)) ||
                    (record?.status === 'COMPLETED');

                  const isHalfDay = record?.status === 'HALF_DAY';
                  const isLeave = !!leaveItem || record?.status === 'APPROVED' || record?.status === 'ON_LEAVE' || record?.status === 'LEAVE' || rosterItem?.type === 'LEAVE';
                  const isHoliday = !!holidayItem || record?.status === 'HOLIDAY' || rosterItem?.type === 'HOLIDAY';
                  const isWFH = rosterItem?.type === 'WFH' || leaveItem?.workFromHome;

                  const isExplicitAbsent = record?.status === 'ABSENT';
                  const isUnmarkedAbsent = isPast && isCurrentMonth && !isPresent && !isHalfDay && !isLeave && !isHoliday && !isWeekendOrOff;
                  const isAbsent = isExplicitAbsent || isUnmarkedAbsent;

                  let bgClass = "bg-card border-slate-200 dark:border-slate-800 hover:border-blue-400";
                  let statusBadge = null;
                  let timeDetails = null;
                  let mobileIndicator: React.ReactNode = null;
                  let dayStatusForModal: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'SCHEDULED' = 'SCHEDULED';
                  let dayStatusLabel = 'Scheduled Shift';

                  if (!isCurrentMonth) {
                    bgClass = "bg-muted/10 border-transparent opacity-25 cursor-default";
                  } else if (isPresent) {
                    dayStatusForModal = 'PRESENT';
                    dayStatusLabel = 'Present';
                    bgClass = "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/70 hover:border-emerald-500 shadow-2xs";
                    statusBadge = (
                      <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[7.5px] sm:text-[10px] font-black bg-emerald-600 text-white flex items-center justify-center sm:gap-1 shrink-0 shadow-2xs">
                        <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>P</span>
                        <span className="hidden sm:inline font-semibold">Present</span>
                      </span>
                    );
                    timeDetails = (
                      <div className="flex flex-col gap-0.5 mt-1 text-[9.5px]">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300 truncate font-mono">
                          {shiftDisplayTiming}
                        </span>
                        <span className="text-[9px] text-emerald-700/90 dark:text-emerald-400 font-semibold flex items-center justify-between">
                          <span>{record?.effectiveHours ? `${Number(record.effectiveHours).toFixed(1)}h worked` : 'Punched In'}</span>
                        </span>
                      </div>
                    );
                    mobileIndicator = (
                      <span className="text-[6.5px] font-black text-emerald-800 dark:text-emerald-300 block text-center truncate leading-none min-w-0">
                        {record?.effectiveHours ? `${Number(record.effectiveHours).toFixed(1)}h` : 'In'}
                      </span>
                    );
                  } else if (isHalfDay) {
                    dayStatusForModal = 'HALF_DAY';
                    dayStatusLabel = 'Half Day';
                    bgClass = "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 hover:border-amber-500 shadow-2xs";
                    statusBadge = (
                      <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[6.5px] sm:text-[10px] font-black bg-amber-600 text-white flex items-center justify-center sm:gap-1 shrink-0 shadow-2xs">
                        <span>HD</span>
                        <span className="hidden sm:inline font-semibold">Half Day</span>
                      </span>
                    );
                    timeDetails = (
                      <div className="flex flex-col gap-0.5 mt-1 text-[9.5px]">
                        <span className="font-semibold text-amber-800 dark:text-amber-300 truncate font-mono">
                          {shiftDisplayTiming}
                        </span>
                        <span className="text-[9px] text-amber-700 dark:text-amber-400 font-semibold">
                          {record?.effectiveHours ? `${Number(record.effectiveHours).toFixed(1)}h worked` : 'Half Day'}
                        </span>
                      </div>
                    );
                    mobileIndicator = (
                      <span className="text-[6.5px] font-bold text-amber-700 dark:text-amber-300 block text-center truncate leading-none min-w-0">
                        {record?.effectiveHours ? `${Number(record.effectiveHours).toFixed(1)}h` : 'Half'}
                      </span>
                    );
                  } else if (isLeave) {
                    dayStatusForModal = 'LEAVE';
                    dayStatusLabel = leaveItem?.leaveType ? `${leaveItem.leaveType} Leave` : 'Approved Leave';
                    bgClass = "bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800 hover:border-amber-400 shadow-2xs";
                    statusBadge = (
                      <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[7.5px] sm:text-[10px] font-black bg-amber-500 text-white flex items-center justify-center sm:gap-1 shrink-0 shadow-2xs">
                        <span>L</span>
                        <span className="hidden sm:inline font-semibold">Leave</span>
                      </span>
                    );
                    timeDetails = (
                      <div className="flex flex-col gap-0.5 mt-1 text-[9.5px]">
                        <span className="font-semibold text-amber-800 dark:text-amber-300 truncate">
                          {leaveItem?.leaveType || 'Leave'}
                        </span>
                        <span className="text-[9px] text-amber-600/90 dark:text-amber-400/90 font-mono">
                          {shiftDisplayName}
                        </span>
                      </div>
                    );
                    mobileIndicator = (
                      <span className="text-[6.5px] font-bold text-amber-700 dark:text-amber-300 block text-center truncate leading-none min-w-0">
                        {leaveItem?.leaveType ? leaveItem.leaveType.slice(0, 3) : 'Leave'}
                      </span>
                    );
                  } else if (isHoliday) {
                    dayStatusForModal = 'HOLIDAY';
                    dayStatusLabel = holidayItem?.name || 'Public Holiday';
                    bgClass = "bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 hover:border-purple-400 shadow-2xs";
                    statusBadge = (
                      <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[7.5px] sm:text-[10px] font-black bg-purple-600 text-white flex items-center justify-center sm:gap-1 shrink-0 shadow-2xs">
                        <span>H</span>
                        <span className="hidden sm:inline font-semibold">Holiday</span>
                      </span>
                    );
                    timeDetails = (
                      <div className="flex flex-col gap-0.5 mt-1 text-[9.5px]">
                        <span className="font-bold text-purple-800 dark:text-purple-300 truncate" title={holidayItem?.name}>
                          {holidayItem?.name || 'Holiday'}
                        </span>
                        <span className="text-[9px] text-purple-600/80 dark:text-purple-400/80">
                          Official Off
                        </span>
                      </div>
                    );
                    mobileIndicator = (
                      <span className="text-[6.5px] font-bold text-purple-700 dark:text-purple-300 block text-center truncate leading-none min-w-0">
                        {holidayItem?.name ? holidayItem.name.slice(0, 4) : 'Off'}
                      </span>
                    );
                  } else if (isWeekendOrOff) {
                    dayStatusForModal = 'WEEKEND';
                    dayStatusLabel = 'Weekly Off';
                    bgClass = "bg-slate-50/90 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-2xs";
                    statusBadge = (
                      <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[6.5px] sm:text-[10px] font-bold bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                        <span className="sm:hidden">O</span>
                        <span className="hidden sm:inline">OFF</span>
                      </span>
                    );
                    timeDetails = (
                      <div className="mt-1 text-[9.5px] text-muted-foreground font-medium">
                        <span>Week Off</span>
                      </div>
                    );
                    mobileIndicator = (
                      <span className="text-[6.5px] text-muted-foreground block text-center truncate leading-none min-w-0">
                        Off
                      </span>
                    );
                  } else if (isAbsent) {
                    dayStatusForModal = 'ABSENT';
                    dayStatusLabel = 'Absent';
                    bgClass = "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 hover:border-rose-400 shadow-2xs";
                    statusBadge = (
                      <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[7.5px] sm:text-[10px] font-black bg-rose-600 text-white flex items-center justify-center sm:gap-1 shrink-0 shadow-2xs">
                        <span>A</span>
                        <span className="hidden sm:inline font-semibold">Absent</span>
                      </span>
                    );
                    timeDetails = (
                      <div className="flex flex-col gap-0.5 mt-1 text-[9.5px]">
                        <span className="font-semibold text-rose-700 dark:text-rose-300 truncate font-mono">
                          {shiftDisplayTiming}
                        </span>
                        <span className="text-[9px] text-rose-600/90 dark:text-rose-400/90 font-medium">
                          No Punch
                        </span>
                      </div>
                    );
                    mobileIndicator = (
                      <span className="text-[6.5px] font-extrabold text-rose-600 dark:text-rose-400 block text-center truncate leading-none min-w-0">
                        Abs
                      </span>
                    );
                  } else if (isWFH) {
                    dayStatusForModal = 'SCHEDULED';
                    dayStatusLabel = 'Work From Home';
                    bgClass = "bg-teal-50/80 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800 hover:border-teal-400 shadow-2xs";
                    statusBadge = (
                      <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[6.5px] sm:text-[10px] font-black bg-teal-600 text-white flex items-center justify-center sm:gap-1 shrink-0 shadow-2xs">
                        <span className="sm:hidden">W</span>
                        <span className="hidden sm:inline">WFH</span>
                      </span>
                    );
                    timeDetails = (
                      <div className="flex flex-col gap-0.5 mt-1 text-[9.5px]">
                        <span className="font-semibold text-teal-800 dark:text-teal-300 truncate font-mono">
                          {shiftDisplayTiming}
                        </span>
                        <span className="text-[9px] text-teal-600 dark:text-teal-400">
                          Remote Shift
                        </span>
                      </div>
                    );
                    mobileIndicator = (
                      <span className="text-[6.5px] text-teal-600 block text-center truncate leading-none min-w-0">
                        WFH
                      </span>
                    );
                  } else {
                    dayStatusForModal = 'SCHEDULED';
                    dayStatusLabel = isCurrentDay ? 'Active Working Shift' : 'Scheduled Shift';
                    bgClass = isCurrentDay 
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 hover:border-blue-500 shadow-2xs"
                      : "bg-blue-50/40 dark:bg-blue-950/15 border-blue-200 dark:border-blue-900/50 hover:border-blue-400";
                    statusBadge = (
                      <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[7px] sm:text-[9.5px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <span className="sm:hidden">S</span>
                        <span className="hidden sm:inline">{isCurrentDay ? 'Active' : 'Shift'}</span>
                      </span>
                    );
                    timeDetails = (
                      <div className="flex flex-col gap-0.5 mt-1 text-[9.5px]">
                        <span className="font-semibold text-blue-700 dark:text-blue-300 truncate">
                          {shiftDisplayName}
                        </span>
                        <span className="text-[9px] font-mono text-blue-600/90 dark:text-blue-400/90">
                          {shiftDisplayTiming}
                        </span>
                      </div>
                    );
                    mobileIndicator = (
                      <span className="text-[6.5px] font-mono text-blue-600 dark:text-blue-400 block text-center truncate leading-none min-w-0">
                        {shiftDisplayTiming.split(' - ')[0] || 'Shift'}
                      </span>
                    );
                  }

                  const firstPunchIn = record?.logs?.[0]?.punchIn;
                  const lastPunchOut = record?.logs?.slice(-1)[0]?.punchOut;

                  return (
                    <div
                      key={format(d, 'yyyy-MM-dd')}
                      onClick={() => {
                        if (!isCurrentMonth) return;
                        setSelectedDay({
                          date: d,
                          status: dayStatusForModal,
                          statusLabel: dayStatusLabel,
                          punchIn: firstPunchIn ? format(new Date(firstPunchIn), 'hh:mm a') : undefined,
                          punchOut: lastPunchOut ? format(new Date(lastPunchOut), 'hh:mm a') : undefined,
                          hours: record?.effectiveHours ? Number(record.effectiveHours) : undefined,
                          shiftName: shiftDisplayName,
                          shiftTiming: shiftDisplayTiming,
                          note: isAbsent ? 'No punch logs were recorded on this scheduled working day.' : undefined
                        });
                      }}
                      className={`min-w-0 min-h-[42px] sm:min-h-[86px] p-0.5 sm:p-2 rounded sm:rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none overflow-hidden ${bgClass} ${
                        isCurrentDay ? 'ring-1.5 sm:ring-2 ring-primary ring-offset-0 sm:ring-offset-1 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full min-w-0 gap-0.5">
                        <span className={`text-[9px] sm:text-xs font-mono font-bold leading-none shrink-0 ${
                          isCurrentDay ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {format(d, 'd')}
                        </span>
                        {isCurrentDay && !statusBadge ? (
                          <span className="w-3.5 h-3.5 sm:w-auto sm:px-1.5 sm:py-0.5 rounded text-[7px] sm:text-[9px] font-black bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
                            <span className="sm:hidden">T</span>
                            <span className="hidden sm:inline">TODAY</span>
                          </span>
                        ) : (
                          statusBadge
                        )}
                      </div>

                      {/* Desktop Detailed Shift & Attendance */}
                      <div className="hidden sm:flex mt-1 flex-col justify-end">
                        {timeDetails}
                      </div>

                      {/* Mobile Compact Sub-label */}
                      <div className="sm:hidden mt-0.5 flex flex-col justify-end w-full min-w-0 overflow-hidden">
                        {mobileIndicator}
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
      <div className="p-2 sm:p-4 border-t bg-muted/10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3 text-center text-xs min-w-0">
        <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-card border shadow-2xs min-w-0">
          <span className="text-muted-foreground text-[9.5px] sm:text-[11px] block truncate">{t("Present Days")}</span>
          <span className="text-xs sm:text-base font-extrabold text-emerald-600 font-mono block truncate">{presentCount} Days</span>
        </div>
        <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-card border shadow-2xs min-w-0">
          <span className="text-muted-foreground text-[9.5px] sm:text-[11px] block truncate">{t("Absent Days")}</span>
          <span className="text-xs sm:text-base font-extrabold text-rose-600 font-mono block truncate">{absentCount} Days</span>
        </div>
        <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-card border shadow-2xs min-w-0">
          <span className="text-muted-foreground text-[9.5px] sm:text-[11px] block truncate">{t("Leaves Taken")}</span>
          <span className="text-xs sm:text-base font-extrabold text-amber-600 font-mono block truncate">{leaveCount} Days</span>
        </div>
        <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-card border shadow-2xs min-w-0">
          <span className="text-muted-foreground text-[9.5px] sm:text-[11px] block truncate">{t("Assigned Shift")}</span>
          <span className="text-[11px] sm:text-base font-extrabold text-blue-600 truncate block" title={shiftInfo.name}>
            {shiftInfo.name}
          </span>
        </div>
      </div>

      {/* Detailed Shift & Attendance Day Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        {selectedDay && (
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span>{format(selectedDay.date, 'EEEE, dd MMMM yyyy')}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Attendance breakdown and shift schedule details for this date.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground">Attendance Status</span>
                <Badge className={
                  selectedDay.status === 'PRESENT' ? 'bg-emerald-600' :
                  selectedDay.status === 'ABSENT' ? 'bg-rose-600' :
                  selectedDay.status === 'HALF_DAY' ? 'bg-amber-600' :
                  selectedDay.status === 'LEAVE' ? 'bg-amber-500' :
                  selectedDay.status === 'HOLIDAY' ? 'bg-purple-600' :
                  selectedDay.status === 'WEEKEND' ? 'bg-slate-600' : 'bg-blue-600'
                }>
                  {selectedDay.statusLabel}
                </Badge>
              </div>

              {/* Shift Information */}
              <div className="space-y-2 border rounded-xl p-3">
                <span className="text-xs font-bold text-foreground block border-b pb-1">Assigned Working Shift</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Shift Name</span>
                    <span className="font-semibold text-foreground">{selectedDay.shiftName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Timing</span>
                    <span className="font-semibold text-foreground font-mono">{selectedDay.shiftTiming}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Break Duration</span>
                    <span className="font-semibold text-foreground">{shiftInfo.breakTime}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Working Policy</span>
                    <span className="font-semibold text-foreground">{shiftInfo.workingDays}</span>
                  </div>
                </div>
              </div>

              {/* Punch Logs if Present */}
              {selectedDay.status === 'PRESENT' && (
                <div className="space-y-2 border rounded-xl p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block border-b border-emerald-200 dark:border-emerald-800 pb-1 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Attendance Logs</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Punch In</span>
                      <span className="font-bold text-foreground font-mono">{selectedDay.punchIn || 'Recorded'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Punch Out</span>
                      <span className="font-bold text-foreground font-mono">{selectedDay.punchOut || 'Recorded'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Effective Hours</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {selectedDay.hours ? `${selectedDay.hours.toFixed(1)} hrs` : 'Session Active'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Absent Note if Absent */}
              {selectedDay.status === 'ABSENT' && (
                <div className="space-y-2 border rounded-xl p-3 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>Absent Record</span>
                  </div>
                  <p className="text-[11px] text-rose-700/90 dark:text-rose-300">
                    {selectedDay.note || 'No attendance punches or approved leave records were logged for this day.'}
                  </p>
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
