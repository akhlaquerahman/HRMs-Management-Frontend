"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Clock, AlertCircle, FileEdit, ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RequestCorrectionModal } from './RequestCorrectionModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBreakTypeConfig } from '@/lib/breakTypes';

interface AttendanceTableProps {
  records: any[];
  isLoading: boolean;
}

/**
 * Formats seconds into clean human-readable hours & minutes (e.g., "4h 47m", "17m", "0m")
 */
function formatDurationHM(totalSec: number, fallbackZero: string = '0m'): string {
  if (!totalSec || totalSec <= 0) return fallbackZero;
  const totalMinutes = Math.floor(totalSec / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const s = totalSec % 60;

  if (h === 0 && m === 0) return `${s}s`;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function AttendanceTable({ records, isLoading }: AttendanceTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'date', direction: 'desc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null; // Reset to default on 3rd click (or just keep desc, but enterprise level often cycles)
    // Actually, let's just toggle between asc and desc for simplicity and consistency
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRecords = [...records].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    
    let aVal: any = '';
    let bVal: any = '';

    if (sortConfig.key === 'date') {
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
    } else if (sortConfig.key === 'checkIn') {
      aVal = a.logs && a.logs.length > 0 ? new Date(a.logs[0].punchIn).getTime() : 0;
      bVal = b.logs && b.logs.length > 0 ? new Date(b.logs[0].punchIn).getTime() : 0;
    } else if (sortConfig.key === 'checkOut') {
      aVal = a.logs && a.logs.length > 0 && a.logs[a.logs.length - 1].punchOut ? new Date(a.logs[a.logs.length - 1].punchOut).getTime() : 0;
      bVal = b.logs && b.logs.length > 0 && b.logs[b.logs.length - 1].punchOut ? new Date(b.logs[b.logs.length - 1].punchOut).getTime() : 0;
    } else if (sortConfig.key === 'workingHours') {
      aVal = Number(a.effectiveHours || 0);
      bVal = Number(b.effectiveHours || 0);
    } else if (sortConfig.key === 'status') {
      const isPunchedInA = a.logs && a.logs.length > 0 && !a.logs[a.logs.length - 1].punchOut;
      const isPunchedInB = b.logs && b.logs.length > 0 && !b.logs[b.logs.length - 1].punchOut;
      aVal = isPunchedInA ? "YET TO CHECK OUT" : a.status;
      bVal = isPunchedInB ? "YET TO CHECK OUT" : b.status;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/80 select-none group transition-colors" 
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <div className="text-muted-foreground flex flex-col">
          {sortConfig.key === sortKey ? (
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </TableHead>
  );

  const totalRecords = sortedRecords.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedRecords = sortedRecords.slice((page - 1) * pageSize, page * pageSize);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: string) => {
    let style = "bg-muted text-muted-foreground border-muted";
    let label = status;

    if (status === 'PRESENT') {
      style = "bg-emerald-100 text-emerald-700 border-emerald-200";
      label = "Present";
    } else if (status === 'INSUFFICIENT_HOURS') {
      style = "bg-purple-100 text-purple-700 border-purple-200";
      label = "Insufficient Hours";
    } else if (status === 'HALF_DAY') {
      style = "bg-amber-100 text-amber-700 border-amber-200";
      label = "Half Day";
    } else if (status === 'ABSENT') {
      style = "bg-rose-100 text-rose-700 border-rose-200";
      label = "Absent";
    } else if (status === 'LEAVE') {
      style = "bg-blue-100 text-blue-700 border-blue-200";
      label = "On Leave";
    } else if (status.includes('Punch Out') || status.includes('CHECK OUT') || status === 'YET_TO_CHECK_OUT') {
      style = "bg-indigo-100 text-indigo-700 border-indigo-200";
      label = "Yet to Check Out";
    }

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-block ${style}`}>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-12">
        <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <Table className="min-w-[1950px] border-collapse text-xs">
          <TableHeader className="bg-muted/50 sticky top-0 z-10 border-b">
            <TableRow>
              <TableHead className="w-10 px-3"></TableHead>
              {/* 1. Date */}
              <TableHead className="w-[130px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Date</TableHead>
              {/* 2. Status */}
              <TableHead className="w-[160px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Status</TableHead>
              {/* 3. Punch In */}
              <TableHead className="w-[120px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Punch In</TableHead>
              {/* 4. Punch Out */}
              <TableHead className="w-[120px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Punch Out</TableHead>
              {/* 5. Session Ended */}
              <TableHead className="w-[150px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Session Ended</TableHead>
              {/* 6. Lunch */}
              <TableHead className="w-[190px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Lunch</TableHead>
              {/* 7. TEA */}
              <TableHead className="w-[190px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">TEA</TableHead>
              {/* 8. Bio */}
              <TableHead className="w-[190px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Bio</TableHead>
              {/* 9. Official */}
              <TableHead className="w-[210px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Official</TableHead>
              {/* 10. Personal */}
              <TableHead className="w-[190px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Personal</TableHead>
              {/* 11. Break Time */}
              <TableHead className="w-[130px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Break Time</TableHead>
              {/* 12. Working Hours */}
              <TableHead className="w-[140px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Working Hours</TableHead>
              {/* 13. Shift */}
              <TableHead className="w-[160px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Shift</TableHead>
              {/* 14. Actions */}
              <TableHead className="w-[120px] font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((item: any) => {
              const logs = [...(item.logs || [])].sort((a: any, b: any) => new Date(a.punchIn).getTime() - new Date(b.punchIn).getTime());
              const isPunchedIn = logs.length > 0 && !logs[logs.length - 1].punchOut;
              const displayStatus = isPunchedIn ? "YET TO Punch Out" : item.status;
              const isExpanded = !!expandedRows[item.id];

              // 1. PUNCH IN (First punch in of the day)
              const firstPunchIn = logs.length > 0 && logs[0].punchIn
                ? format(new Date(logs[0].punchIn), 'hh:mm a')
                : '—';

              // 2. PUNCH OUT (Final completed punch out of the day)
              const lastPunchOut = (logs.length > 0 && logs[logs.length - 1].punchOut)
                ? format(new Date(logs[logs.length - 1].punchOut), 'hh:mm a')
                : '—';

              // 3. SESSION ENDED (Sum of all COMPLETED work session durations)
              let completedSessionSec = 0;
              let grossMs = 0;
              logs.forEach((l: any) => {
                if (l.punchIn && l.punchOut) {
                  const sSec = Math.floor((new Date(l.punchOut).getTime() - new Date(l.punchIn).getTime()) / 1000);
                  completedSessionSec += sSec;
                  grossMs += sSec * 1000;
                }
              });
              const sessionEndedFormatted = completedSessionSec > 0 ? formatDurationHM(completedSessionSec) : '—';

              // 4. BREAK COLUMNS MAPPING (Lunch, TEA, Bio, Official, Personal) & BREAK TIME
              const breaksByType: Record<string, string[]> = {
                LUNCH: [],
                TEA: [],
                BIO: [],
                OFFICIAL: [],
                OTHER: []
              };

              let totalBreakSec = 0;
              (item.breaks || []).forEach((b: any) => {
                const typeNorm = (b.type || 'OTHER').toUpperCase();
                const canonicalKey = ['LUNCH', 'TEA', 'BIO', 'OFFICIAL'].includes(typeNorm) ? typeNorm : 'OTHER';

                const bStart = b.breakStart ? format(new Date(b.breakStart), 'hh:mm a') : '—';
                const bEnd = b.breakEnd ? format(new Date(b.breakEnd), 'hh:mm a') : 'Ongoing';

                breaksByType[canonicalKey].push(`${bStart} - ${bEnd}`);

                if (b.durationSeconds) {
                  totalBreakSec += b.durationSeconds;
                } else if (b.breakStart && b.breakEnd) {
                  totalBreakSec += Math.floor((new Date(b.breakEnd).getTime() - new Date(b.breakStart).getTime()) / 1000);
                } else if (b.durationMinutes) {
                  totalBreakSec += b.durationMinutes * 60;
                }
              });

              const breakTimeFormatted = totalBreakSec > 0 ? formatDurationHM(totalBreakSec) : '0m';

              // 5. WORKING HOURS (Authoritative Net Completed Working Hours = Gross Work - Total Breaks)
              const effectiveMs = Math.max(0, grossMs - (totalBreakSec * 1000));
              const effectiveSec = Math.floor(effectiveMs / 1000);
              const workingHoursFormatted = effectiveSec > 0 ? formatDurationHM(effectiveSec) : '—';

              return (
                <React.Fragment key={item.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleRow(item.id)}
                  >
                    {/* Expand Indicator */}
                    <TableCell className="px-3 py-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>

                    {/* 1. Date */}
                    <TableCell className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      {format(new Date(item.date), 'dd MMM yyyy')}
                    </TableCell>

                    {/* 2. Status */}
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(displayStatus)}
                    </TableCell>

                    {/* 3. Punch In */}
                    <TableCell className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {firstPunchIn}
                    </TableCell>

                    {/* 4. Punch Out */}
                    <TableCell className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {lastPunchOut}
                    </TableCell>

                    {/* 5. Session Ended */}
                    <TableCell className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      {sessionEndedFormatted}
                    </TableCell>

                    {/* 6. Lunch */}
                    <TableCell className="px-4 py-3 font-medium text-slate-700 whitespace-pre-line leading-snug">
                      {breaksByType.LUNCH.length > 0 ? breaksByType.LUNCH.join('\n') : <span className="text-slate-400">—</span>}
                    </TableCell>

                    {/* 7. TEA */}
                    <TableCell className="px-4 py-3 font-medium text-slate-700 whitespace-pre-line leading-snug">
                      {breaksByType.TEA.length > 0 ? breaksByType.TEA.join('\n') : <span className="text-slate-400">—</span>}
                    </TableCell>

                    {/* 8. Bio */}
                    <TableCell className="px-4 py-3 font-medium text-slate-700 whitespace-pre-line leading-snug">
                      {breaksByType.BIO.length > 0 ? breaksByType.BIO.join('\n') : <span className="text-slate-400">—</span>}
                    </TableCell>

                    {/* 9. Official */}
                    <TableCell className="px-4 py-3 font-medium text-slate-700 whitespace-pre-line leading-snug">
                      {breaksByType.OFFICIAL.length > 0 ? breaksByType.OFFICIAL.join('\n') : <span className="text-slate-400">—</span>}
                    </TableCell>

                    {/* 10. Personal */}
                    <TableCell className="px-4 py-3 font-medium text-slate-700 whitespace-pre-line leading-snug">
                      {breaksByType.OTHER.length > 0 ? breaksByType.OTHER.join('\n') : <span className="text-slate-400">—</span>}
                    </TableCell>

                    {/* 11. Break Time */}
                    <TableCell className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                      {breakTimeFormatted}
                    </TableCell>

                    {/* 12. Working Hours */}
                    <TableCell className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                      {workingHoursFormatted}
                    </TableCell>

                    {/* 13. Shift */}
                    <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {item.shift?.name || 'General Shift'}
                    </TableCell>

                    {/* 14. Actions */}
                    <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 font-medium border-muted-foreground/20 hover:border-primary hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(item);
                          setModalOpen(true);
                        }}
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Correct
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Timeline Drawer */}
                  {isExpanded && (
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={15} className="p-0 border-b">
                        <div className="p-5 bg-muted/5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> Daily Timeline Log & Detailed Session Audit
                          </h4>
                          <div className="relative border-l-2 border-primary/20 ml-3 space-y-4">
                            {logs.map((log: any, idx: number) => {
                              const grossSessSec = log.punchIn && log.punchOut ? Math.floor((new Date(log.punchOut).getTime() - new Date(log.punchIn).getTime()) / 1000) : 0;
                              
                              let logBreakSec = 0;
                              (item.breaks || []).forEach((b: any) => {
                                if (b.breakStart && b.breakEnd && log.punchIn && log.punchOut) {
                                  const bStart = new Date(b.breakStart).getTime();
                                  const bEnd = new Date(b.breakEnd).getTime();
                                  const pIn = new Date(log.punchIn).getTime();
                                  const pOut = new Date(log.punchOut).getTime();
                                  const overlapStart = Math.max(pIn, bStart);
                                  const overlapEnd = Math.min(pOut, bEnd);
                                  if (overlapEnd > overlapStart) {
                                    logBreakSec += Math.floor((overlapEnd - overlapStart) / 1000);
                                  }
                                }
                              });
                              const netSessSec = Math.max(0, grossSessSec - logBreakSec);

                              return (
                                <div key={`log-${idx}`} className="relative pl-6">
                                  <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 ring-4 ring-background" />
                                  <div className="text-xs font-semibold text-foreground">
                                    {idx === 0 ? "Checked In (Session 1)" : `Resumed Work (Session ${idx + 1})`}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">{format(new Date(log.punchIn), 'hh:mm a')}</div>

                                  {log.punchOut && (
                                    <div className="mt-3 relative">
                                      <div className="absolute w-3 h-3 bg-rose-500 rounded-full -left-[31px] top-1.5 ring-4 ring-background" />
                                      <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                                        <span>Work Session Ended</span>
                                        {netSessSec > 0 && (
                                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border">
                                            {formatDurationHM(netSessSec)} net worked
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">{format(new Date(log.punchOut), 'hh:mm a')}</div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {(item.breaks || []).map((b: any, idx: number) => {
                              const bInfo = getBreakTypeConfig(b.type);
                              const bSec = b.durationSeconds || (b.breakStart && b.breakEnd ? Math.floor((new Date(b.breakEnd).getTime() - new Date(b.breakStart).getTime()) / 1000) : (b.durationMinutes ? b.durationMinutes * 60 : 0));
                              return (
                                <div key={`break-${idx}`} className="relative pl-6">
                                  <div className="absolute w-3 h-3 bg-amber-500 rounded-full -left-[7px] top-1.5 ring-4 ring-background" />
                                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 font-bold text-foreground">
                                      <span>{bInfo.emoji}</span>
                                      <span>{bInfo.label} Started</span>
                                    </span>
                                    {bSec > 0 && (
                                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${bInfo.badgeStyle}`}>
                                        {formatDurationHM(bSec)} consumed
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">{format(new Date(b.breakStart), 'hh:mm a')}</div>

                                  {b.breakEnd && (
                                    <div className="mt-3 relative">
                                      <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[31px] top-1.5 ring-4 ring-background" />
                                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <span>{bInfo.emoji}</span>
                                        <span>{bInfo.label} Ended (Resumed Work)</span>
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">{format(new Date(b.breakEnd), 'hh:mm a')}</div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {(!logs || logs.length === 0) && (
                              <div className="text-xs text-muted-foreground ml-6 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> No logs available for this date.
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}

            {paginatedRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} className="h-32 text-center text-muted-foreground">
                  No attendance records found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-4">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalRecords)} of {totalRecords} entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>

      <RequestCorrectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        recordDate={selectedRecord ? new Date(selectedRecord.date) : undefined}
        currentIn={selectedRecord?.logs?.[0]?.punchIn ? new Date(selectedRecord.logs[0].punchIn) : undefined}
        currentOut={selectedRecord?.logs?.[selectedRecord.logs.length - 1]?.punchOut ? new Date(selectedRecord.logs[selectedRecord.logs.length - 1].punchOut) : undefined}
      />
    </div>
  );
}
