"use client";

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  LogIn, LogOut, MapPin, Loader2, Coffee, 
  ChevronDown, Play, Sparkles, Clock, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BREAK_TYPES, getBreakTypeConfig } from '@/lib/breakTypes';

interface AttendancePunchWidgetProps {
  compact?: boolean;
}

export function AttendancePunchWidget({ compact = false }: AttendancePunchWidgetProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [breakTimer, setBreakTimer] = useState("00:00:00");

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['attendance_status'],
    queryFn: async () => (await api.get('/attendance/status')).data.data,
    refetchInterval: 15000 // Refetch every 15 seconds
  });

  const currentState = statusData?.currentState || "NOT_PUNCHED_IN";
  const currentRecord = statusData?.record;
  const activeBreak = statusData?.activeBreak || currentRecord?.breaks?.find((b: any) => !b.breakEnd);

  const startTime = currentRecord?.logs?.[0]?.punchIn
    ? format(new Date(currentRecord.logs[0].punchIn), 'hh:mm a')
    : '';

  const breakStartMs = activeBreak?.breakStart ? new Date(activeBreak.breakStart).getTime() : null;

  // Live Break Stopwatch with Seconds (HH:MM:SS)
  useEffect(() => {
    if (currentState === "ON_BREAK" && breakStartMs) {
      const updateTimer = () => {
        const now = Date.now();
        const diffSec = Math.max(0, Math.floor((now - breakStartMs) / 1000));

        const hours = Math.floor(diffSec / 3600).toString().padStart(2, '0');
        const mins = Math.floor((diffSec % 3600) / 60).toString().padStart(2, '0');
        const secs = (diffSec % 60).toString().padStart(2, '0');

        setBreakTimer(`${hours}:${mins}:${secs}`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setBreakTimer("00:00:00");
    }
  }, [currentState, breakStartMs]);

  const handlePunchIn = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/attendance/punch-in', {});
      toast.success("Checked in successfully!");
      invalidateAllQueries();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error punching in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/attendance/punch-out');
      toast.success("Checked out successfully!");
      invalidateAllQueries();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error punching out");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartBreak = async (type: string) => {
    try {
      setIsSubmitting(true);
      const breakInfo = BREAK_TYPES.find(b => b.id === type);
      await api.post('/attendance/break-start', { type });
      toast.success(`${breakInfo?.label || 'Break'} started! Take care.`);
      invalidateAllQueries();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error starting break");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/attendance/break-end');
      toast.success("Break ended! Welcome back to work.");
      invalidateAllQueries();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error resuming work");
    } finally {
      setIsSubmitting(false);
    }
  };

  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance_status'] });
    queryClient.invalidateQueries({ queryKey: ['my_attendance'] });
    queryClient.invalidateQueries({ queryKey: ['attendance_summary'] });
    queryClient.invalidateQueries({ queryKey: ['attendance_charts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
  };

  if (statusLoading) {
    return (
      <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-800/60 animate-pulse rounded-xl border border-slate-200/50" />
    );
  }

  // STATE 1: NOT PUNCHED IN
  if (currentState === "NOT_PUNCHED_IN") {
    return (
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <Button
          size={compact ? "sm" : "default"}
          className="relative group overflow-hidden font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-95 px-3 sm:px-5 py-1.5 sm:py-2.5 h-8 sm:h-10 rounded-xl border border-emerald-400/40"
          onClick={handlePunchIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-white"></span>
              </span>
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
          <span className="ml-1 tracking-wide hidden sm:inline">Punch In</span>
          <span className="ml-1 tracking-wide sm:hidden text-xs">In</span>
        </Button>
      </div>
    );
  }

  // STATE 2: PUNCHED IN (ACTIVE WORKING)
  if (currentState === "PUNCHED_IN") {
    return (
      <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-sm shrink-0">
        
        {/* Working Status Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg sm:rounded-xl border border-emerald-200/60 dark:border-emerald-800/50">
          <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col text-left">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 leading-none">Working</span>
            {startTime && (
              <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight mt-0.5">
                Since {startTime}
              </span>
            )}
          </div>
        </div>

        {/* Break Dropdown Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="font-semibold border-amber-200/90 dark:border-amber-900/60 bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 transition-all gap-1 shadow-none rounded-lg sm:rounded-xl px-2 sm:px-3 h-7 sm:h-9"
              disabled={isSubmitting}
            >
              <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline text-xs sm:text-sm">Break</span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-2xl border-slate-200 dark:border-slate-800 rounded-xl">
            <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Select Break Type
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
            {BREAK_TYPES.map((type) => {
              const IconComponent = type.icon;
              return (
                <DropdownMenuItem
                  key={type.id}
                  onSelect={() => handleStartBreak(type.id)}
                  className="cursor-pointer py-2 px-2.5 rounded-lg flex items-start gap-2.5 focus:bg-amber-50 dark:focus:bg-amber-950/40 transition-colors"
                >
                  <div className={`p-1.5 rounded-md shrink-0 border ${type.color}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{type.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{type.desc}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Punch Out Button */}
        <Button
          size="sm"
          variant="destructive"
          className="font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md shadow-rose-600/20 bg-rose-600 hover:bg-rose-500 text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 px-2 sm:px-3 h-7 sm:h-9"
          onClick={handlePunchOut}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
          )}
          <span className="hidden sm:inline">Punch Out</span>
          <span className="sm:hidden text-xs">Out</span>
        </Button>
      </div>
    );
  }

  // STATE 3: ON BREAK
  if (currentState === "ON_BREAK") {
    const activeBreakConfig = getBreakTypeConfig(activeBreak?.type);
    const BreakIcon = activeBreakConfig.icon;

    return (
      <div className="flex items-center gap-1 sm:gap-2 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 pl-2 sm:pl-3 shadow-sm shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity pr-1">
              <div className="relative">
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <BreakIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              </div>

              <div className="flex flex-col text-left">
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 leading-none">
                  <span>On {activeBreakConfig.shortLabel || activeBreakConfig.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </div>
                <span className="text-[11px] sm:text-xs font-mono font-black text-amber-600 dark:text-amber-400 leading-tight tracking-tight">
                  ⏱ {breakTimer}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 p-1.5 shadow-2xl border-amber-200 dark:border-amber-900 rounded-xl">
            <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Switch Break Type
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
            {BREAK_TYPES.map((type) => {
              const IconComp = type.icon;
              return (
                <DropdownMenuItem
                  key={type.id}
                  onSelect={() => handleStartBreak(type.id)}
                  className="cursor-pointer py-1.5 px-2 rounded-lg flex items-center gap-2 focus:bg-amber-50 dark:focus:bg-amber-950/40"
                >
                  <IconComp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{type.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 sm:h-7 w-px bg-amber-200 dark:bg-amber-800 mx-0.5 sm:mx-1" />

        <Button
          size="sm"
          className="font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 gap-1 rounded-lg sm:rounded-xl border border-emerald-400/30 px-2 sm:px-3 h-7 sm:h-9"
          onClick={handleEndBreak}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
          )}
          <span className="hidden sm:inline">Resume Work</span>
          <span className="sm:hidden text-xs">Resume</span>
        </Button>
      </div>
    );
  }

  // STATE 4: PUNCHED OUT (SESSION ENDED)
  if (currentState === "PUNCHED_OUT" && (statusData?.canResume ?? true)) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 pl-2 sm:pl-3.5 shadow-sm shrink-0">
        <div className="flex flex-col text-left pr-0.5 sm:pr-1">
          <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Session Ended</span>
          <span className="text-[10px] sm:text-[11px] font-mono font-semibold text-slate-500 leading-tight">
            {statusData?.dailyWorkingHours ? `${statusData.dailyWorkingHours} worked` : 'Done'}
          </span>
        </div>
        <Button
          size="sm"
          className="font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 gap-1 rounded-lg sm:rounded-xl px-2 sm:px-3 h-7 sm:h-9"
          onClick={handlePunchIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
          )}
          <span className="hidden sm:inline">Resume Shift</span>
          <span className="sm:hidden text-xs">Resume</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
      <span className="hidden sm:inline">Shift Completed</span>
      <span className="sm:hidden text-xs">Completed</span>
    </div>
  );
}
