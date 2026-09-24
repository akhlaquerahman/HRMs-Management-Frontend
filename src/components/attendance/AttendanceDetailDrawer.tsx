"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Clock, Coffee, CheckCircle2, User, Calendar, ShieldCheck } from "lucide-react";
import { AttendanceRecordDto } from "./AttendanceTable";

interface AttendanceDetailDrawerProps {
  record: AttendanceRecordDto | null;
  open: boolean;
  onClose: () => void;
}

export const AttendanceDetailDrawer: React.FC<AttendanceDetailDrawerProps> = ({ record, open, onClose }) => {
  if (!record) return null;

  const empName = record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : "Employee";

  return (
    <Sheet open={open} onOpenChange={openState => !openState && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border">
              {record.employee?.firstName?.[0] || 'E'}
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-foreground">{empName}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{record.employeeId}</span>
                <span>•</span>
                <span>{record.employee?.department?.name || 'Department'}</span>
                <span>•</span>
                <span>{record.employee?.designation?.name || 'Designation'}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Date & Overall Status */}
        <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3.5 rounded-xl border">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase">ATTENDANCE DATE</span>
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {record.dateFormatted}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase">STATUS</span>
            <span className="text-sm font-bold text-foreground inline-flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {record.status}
            </span>
          </div>
        </div>

        {/* WORK SESSIONS */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5 border-b pb-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            WORK SESSIONS ({record.logs.length})
          </h4>

          {record.logs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No work sessions recorded.</p>
          ) : (
            <div className="space-y-2">
              {record.logs.map((log: any, idx: number) => (
                <div key={log.id || idx} className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">Session {idx + 1}</span>
                    <span className="text-muted-foreground text-[11px]">
                      {log.punchInFormatted} → {log.punchOutFormatted}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">{log.durationMinutes} mins</span>
                    <span className={`block text-[10px] font-semibold ${log.punchOut ? 'text-emerald-600' : 'text-blue-600 animate-pulse'}`}>
                      {log.punchOut ? 'Completed' : 'Active Session'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BREAK SESSIONS */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5 border-b pb-1.5">
            <Coffee className="h-3.5 w-3.5 text-amber-500" />
            BREAK TIMELINE
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border bg-card">
              <span className="text-[10px] font-semibold text-muted-foreground block">LUNCH</span>
              <span className="font-medium text-foreground">{record.lunch}</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card">
              <span className="text-[10px] font-semibold text-muted-foreground block">TEA</span>
              <span className="font-medium text-foreground">{record.tea}</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card">
              <span className="text-[10px] font-semibold text-muted-foreground block">BIO</span>
              <span className="font-medium text-foreground">{record.bio}</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card">
              <span className="text-[10px] font-semibold text-muted-foreground block">OFFICIAL</span>
              <span className="font-medium text-foreground">{record.official}</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card col-span-2">
              <span className="text-[10px] font-semibold text-muted-foreground block">PERSONAL / OTHER</span>
              <span className="font-medium text-foreground">{record.personal}</span>
            </div>
          </div>
        </div>

        {/* SUMMARY CALCULATION */}
        <div className="space-y-2 border-t pt-4">
          <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">
            WORKING HOURS SUMMARY
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Completed Session Duration:</span>
              <span className="font-semibold text-foreground">{record.sessionEnded}</span>
            </div>
            {record.activeSession && (
              <div className="flex justify-between text-blue-600 font-medium">
                <span>Active Session Duration (Live):</span>
                <span>{record.activeSession.durationFormatted}</span>
              </div>
            )}
            <div className="flex justify-between text-amber-600 font-medium">
              <span>Total Break Duration:</span>
              <span>- {record.breakTime}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground border-t pt-2 mt-2">
              <span>Effective Working Hours:</span>
              <span className="text-primary">{record.workingHours}</span>
            </div>
          </div>
        </div>

        {/* AUDIT INFO */}
        <div className="pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Authoritative backend calculation engine active. All manual edits recorded with full audit log trail.</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
