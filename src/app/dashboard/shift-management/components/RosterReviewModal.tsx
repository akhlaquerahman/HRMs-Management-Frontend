"use client";

import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Users, 
  CalendarDays, 
  Building, 
  Clock,
  ShieldCheck,
  FileCheck
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

interface RosterReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentName: string;
  designationName: string;
  weekStartStr: string;
  weekEndStr: string;
  stats: {
    totalEmployees: number;
    scheduled: number;
    weekOff: number;
    onLeave: number;
    unassigned: number;
    conflicts: number;
  };
  conflicts: Array<{
    employeeName: string;
    date: string;
    message: string;
  }>;
  onConfirmPublish: () => void;
  isPublishing: boolean;
}

export function RosterReviewModal({
  isOpen,
  onClose,
  departmentName,
  designationName,
  weekStartStr,
  weekEndStr,
  stats,
  conflicts,
  onConfirmPublish,
  isPublishing
}: RosterReviewModalProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            Review Roster Schedule Before Publishing
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Once published, this schedule will become visible to all employees in their dashboards and attendance views.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          
          {/* Metadata Card */}
          <div className="p-4 rounded-xl border bg-muted/10 grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground block text-[11px] font-semibold">Department</span>
              <span className="font-bold text-foreground text-sm">{departmentName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-semibold">Designation Scope</span>
              <span className="font-bold text-foreground text-sm">{designationName}</span>
            </div>
            <div className="col-span-2 pt-2 border-t flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Week Duration:</span>
              <Badge variant="outline" className="font-mono font-bold text-xs bg-primary/10 text-primary border-primary/20">
                {weekStartStr} – {weekEndStr}
              </Badge>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            <div className="p-2 rounded-lg border bg-card">
              <span className="text-[10px] text-muted-foreground block">Total</span>
              <span className="font-extrabold text-base text-foreground">{stats.totalEmployees}</span>
            </div>
            <div className="p-2 rounded-lg border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <span className="text-[10px] block">Scheduled</span>
              <span className="font-extrabold text-base">{stats.scheduled}</span>
            </div>
            <div className="p-2 rounded-lg border bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <span className="text-[10px] block">Week Off</span>
              <span className="font-extrabold text-base">{stats.weekOff}</span>
            </div>
            <div className="p-2 rounded-lg border bg-rose-500/10 text-rose-700 dark:text-rose-400">
              <span className="text-[10px] block">On Leave</span>
              <span className="font-extrabold text-base">{stats.onLeave}</span>
            </div>
            <div className="p-2 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span className="text-[10px] block">Unassigned</span>
              <span className="font-extrabold text-base">{stats.unassigned}</span>
            </div>
            <div className={`p-2 rounded-lg border ${stats.conflicts > 0 ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold border-rose-500/30 animate-pulse' : 'bg-card'}`}>
              <span className="text-[10px] block">Conflicts</span>
              <span className="font-extrabold text-base">{stats.conflicts}</span>
            </div>
          </div>

          {/* Conflict Warnings List */}
          {stats.conflicts > 0 ? (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>⚠ {stats.conflicts} Schedule Conflict(s) Detected</span>
              </div>
              <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1 text-[11px] text-muted-foreground pl-6">
                {conflicts.map((c, i) => (
                  <div key={i} className="list-disc">
                    • <span className="font-semibold text-foreground">{c.employeeName}</span> ({c.date}): {c.message}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ Roster schedule is fully validated. Zero conflicts detected!</span>
            </div>
          )}

        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPublishing}>
            Back to Edit
          </Button>
          
          <Button 
            size="sm" 
            onClick={onConfirmPublish} 
            disabled={isPublishing}
            className="font-bold bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5 shadow-sm"
          >
            <Send className={`w-3.5 h-3.5 ${isPublishing ? 'animate-bounce' : ''}`} />
            {isPublishing ? 'Publishing...' : 'Confirm & Publish Roster'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
