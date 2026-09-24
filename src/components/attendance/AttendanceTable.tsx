"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, LogIn, LogOut, Play, Edit, User, Coffee } from "lucide-react";

export interface AttendanceRecordDto {
  id: string;
  date: string;
  dateFormatted: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    avatar?: string;
    department?: { name: string };
    designation?: { name: string };
  } | null;
  status: string;
  rawStatus: string;
  punchIn: string;
  punchInTime: string | null;
  punchOut: string;
  punchOutTime: string | null;
  sessionEnded: string;
  sessionEndedMinutes: number;
  activeSession: {
    punchIn: string;
    durationMinutes: number;
    durationFormatted: string;
  } | null;
  lunch: string;
  tea: string;
  bio: string;
  official: string;
  personal: string;
  breakTime: string;
  totalBreakMinutes: number;
  workingHours: string;
  effectiveMinutes: number;
  effectiveHoursDecimal: number;
  shift: {
    id: string;
    name: string;
    startTime?: string;
    endTime?: string;
  } | null;
  logs: any[];
  breaks: any[];
}

interface AttendanceTableProps {
  records: AttendanceRecordDto[];
  isLoading: boolean;
  visibleColumns: Record<string, boolean>;
  onView: (record: AttendanceRecordDto) => void;
  onPunchIn: (record: AttendanceRecordDto) => void;
  onPunchOut: (record: AttendanceRecordDto) => void;
  onResume: (record: AttendanceRecordDto) => void;
  onCorrect: (record: AttendanceRecordDto) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  isLoading,
  visibleColumns,
  onView,
  onPunchIn,
  onPunchOut,
  onResume,
  onCorrect
}) => {
  const isColVisible = (key: string) => visibleColumns[key] !== false;

  const renderStatusBadge = (rec: AttendanceRecordDto) => {
    const raw = rec.rawStatus;
    if (raw === "YET_TO_CHECK_OUT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Currently Working
        </span>
      );
    }
    if (raw === "ON_BREAK") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Coffee className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          On Break
        </span>
      );
    }
    if (raw === "PRESENT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Present
        </span>
      );
    }
    if (raw === "HALF_DAY") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          Half Day
        </span>
      );
    }
    if (raw === "INSUFFICIENT_HOURS") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          Insufficient Hours
        </span>
      );
    }
    if (raw === "ABSENT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
        {rec.status}
      </span>
    );
  };

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto max-h-[650px] relative">
        <Table className="w-full text-xs">
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-md z-10 border-b">
            <TableRow className="hover:bg-transparent">
              {isColVisible("date") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">DATE</TableHead>}
              {isColVisible("employee") && <TableHead className="font-semibold whitespace-nowrap min-w-[180px] sticky left-0 bg-muted/90 backdrop-blur-md z-20 shadow-xs px-3 py-3">EMPLOYEE</TableHead>}
              {isColVisible("employeeId") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">EMPLOYEE ID</TableHead>}
              {isColVisible("status") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">STATUS</TableHead>}
              {isColVisible("punchIn") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">PUNCH IN</TableHead>}
              {isColVisible("punchOut") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">PUNCH OUT</TableHead>}
              {isColVisible("sessionEnded") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">SESSION ENDED</TableHead>}
              {isColVisible("lunch") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">LUNCH</TableHead>}
              {isColVisible("tea") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">TEA</TableHead>}
              {isColVisible("bio") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">BIO</TableHead>}
              {isColVisible("official") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">OFFICIAL</TableHead>}
              {isColVisible("personal") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">PERSONAL</TableHead>}
              {isColVisible("breakTime") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">BREAK TIME</TableHead>}
              {isColVisible("workingHours") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">WORKING HOURS</TableHead>}
              {isColVisible("shift") && <TableHead className="font-semibold whitespace-nowrap px-3 py-3">SHIFT</TableHead>}
              <TableHead className="font-semibold whitespace-nowrap text-right px-3 py-3 min-w-[160px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={16} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="inline-block h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading attendance records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="h-32 text-center text-muted-foreground font-medium">
                  No attendance records found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              records.map(rec => {
                const canPunchIn = !rec.activeSession && rec.logs.length === 0;
                const canPunchOut = !!rec.activeSession;
                const canResume = !rec.activeSession && rec.effectiveMinutes < 480 && rec.logs.length > 0;

                return (
                  <TableRow key={rec.id} className="hover:bg-muted/50 transition-colors">
                    {/* 1. Date */}
                    {isColVisible("date") && (
                      <TableCell className="whitespace-nowrap font-medium px-3 py-2.5">
                        {rec.dateFormatted}
                      </TableCell>
                    )}

                    {/* 2. Employee */}
                    {isColVisible("employee") && (
                      <TableCell className="sticky left-0 bg-card hover:bg-muted/60 z-10 shadow-xs px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border">
                            {rec.employee?.firstName?.[0] || 'E'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">
                              {rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : 'N/A'}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {rec.employee?.designation?.name || rec.employee?.department?.name || ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    )}

                    {/* 3. Employee ID */}
                    {isColVisible("employeeId") && (
                      <TableCell className="whitespace-nowrap font-mono text-muted-foreground px-3 py-2.5">
                        {rec.employeeId || '—'}
                      </TableCell>
                    )}

                    {/* 4. Status */}
                    {isColVisible("status") && (
                      <TableCell className="whitespace-nowrap px-3 py-2.5">
                        {renderStatusBadge(rec)}
                      </TableCell>
                    )}

                    {/* 5. Punch In */}
                    {isColVisible("punchIn") && (
                      <TableCell className="whitespace-nowrap text-foreground font-medium px-3 py-2.5">
                        {rec.punchIn}
                      </TableCell>
                    )}

                    {/* 6. Punch Out */}
                    {isColVisible("punchOut") && (
                      <TableCell className="whitespace-nowrap text-foreground font-medium px-3 py-2.5">
                        {rec.punchOut}
                      </TableCell>
                    )}

                    {/* 7. Session Ended */}
                    {isColVisible("sessionEnded") && (
                      <TableCell className="whitespace-nowrap text-muted-foreground px-3 py-2.5">
                        {rec.sessionEnded}
                      </TableCell>
                    )}

                    {/* 8. Lunch */}
                    {isColVisible("lunch") && (
                      <TableCell className="whitespace-nowrap text-muted-foreground px-3 py-2.5">
                        {rec.lunch}
                      </TableCell>
                    )}

                    {/* 9. Tea */}
                    {isColVisible("tea") && (
                      <TableCell className="whitespace-nowrap text-muted-foreground px-3 py-2.5">
                        {rec.tea}
                      </TableCell>
                    )}

                    {/* 10. Bio */}
                    {isColVisible("bio") && (
                      <TableCell className="whitespace-nowrap text-muted-foreground px-3 py-2.5">
                        {rec.bio}
                      </TableCell>
                    )}

                    {/* 11. Official */}
                    {isColVisible("official") && (
                      <TableCell className="whitespace-nowrap text-muted-foreground px-3 py-2.5">
                        {rec.official}
                      </TableCell>
                    )}

                    {/* 12. Personal */}
                    {isColVisible("personal") && (
                      <TableCell className="whitespace-nowrap text-muted-foreground px-3 py-2.5">
                        {rec.personal}
                      </TableCell>
                    )}

                    {/* 13. Break Time */}
                    {isColVisible("breakTime") && (
                      <TableCell className="whitespace-nowrap font-medium text-amber-600 dark:text-amber-400 px-3 py-2.5">
                        {rec.breakTime}
                      </TableCell>
                    )}

                    {/* 14. Working Hours */}
                    {isColVisible("workingHours") && (
                      <TableCell className="whitespace-nowrap font-bold text-foreground px-3 py-2.5">
                        {rec.workingHours}
                      </TableCell>
                    )}

                    {/* 15. Shift */}
                    {isColVisible("shift") && (
                      <TableCell className="whitespace-nowrap text-muted-foreground px-3 py-2.5">
                        {rec.shift?.name || 'Standard'}
                      </TableCell>
                    )}

                    {/* 16. Actions */}
                    <TableCell className="whitespace-nowrap text-right px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(rec)}
                          title="View Attendance Details"
                          className="h-7 w-7 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {/* Punch In */}
                        {canPunchIn && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPunchIn(rec)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 whitespace-nowrap shrink-0"
                          >
                            <LogIn className="h-3 w-3" />
                            Punch In
                          </Button>
                        )}

                        {/* Punch Out */}
                        {canPunchOut && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPunchOut(rec)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 text-rose-600 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950 whitespace-nowrap shrink-0"
                          >
                            <LogOut className="h-3 w-3" />
                            Punch Out
                          </Button>
                        )}

                        {/* Resume Work */}
                        {canResume && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResume(rec)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 text-indigo-600 border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 whitespace-nowrap shrink-0"
                          >
                            <Play className="h-3 w-3" />
                            Resume
                          </Button>
                        )}

                        {/* Correct Attendance */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onCorrect(rec)}
                          title="Correct Attendance"
                          className="h-7 w-7 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-600"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
