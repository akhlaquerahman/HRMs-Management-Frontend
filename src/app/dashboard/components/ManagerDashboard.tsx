"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { 
  Users, UserCheck, CalendarDays, AlertCircle, Search, 
  ArrowUpRight, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { TeamActivityCard } from '@/components/dashboard/TeamActivityCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ManagerDashboard({ stats }: { stats: any }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("ALL");

  // Pagination state - Default 5 rows per page
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Reset to page 1 when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, attendanceFilter]);

  const getKPIDestination = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('team') || lower.includes('employee')) return '/dashboard/employee-management';
    if (lower.includes('present')) return '/dashboard/attendance';
    if (lower.includes('pending') || lower.includes('approval')) return '/dashboard/leave-management?status=PENDING';
    if (lower.includes('leave')) return '/dashboard/leave-management?status=APPROVED';
    return '/dashboard/employee-management';
  };

  const totalAssigned = stats?.totalAssignedEmployees || 0;
  const presentCount = stats?.presentToday || 0;
  const absentCount = stats?.absentToday || 0;
  const leaveCount = stats?.onLeaveToday || 0;

  const presentPct = stats?.presentPct ?? (totalAssigned > 0 ? Math.round((presentCount / totalAssigned) * 100) : 0);
  const absentPct = stats?.absentPct ?? (totalAssigned > 0 ? Math.round((absentCount / totalAssigned) * 100) : 0);
  const leavePct = stats?.leavePct ?? (totalAssigned > 0 ? Math.round((leaveCount / totalAssigned) * 100) : 0);

  const teamMembers = stats?.teamMembers || [];

  const filteredMembers = teamMembers.filter((emp: any) => {
    const nameMatch = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.email || ''} ${emp.employeeId || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let statusMatch = true;
    if (attendanceFilter === "PRESENT") statusMatch = emp.todayStatus === "PRESENT";
    if (attendanceFilter === "ABSENT") statusMatch = emp.todayStatus === "ABSENT";
    if (attendanceFilter === "ON_LEAVE") statusMatch = emp.todayStatus === "ON_LEAVE";

    return nameMatch && statusMatch;
  });

  // Calculate pagination bounds
  const totalItems = filteredMembers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-6">
      {/* 4-Column Responsive Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        {stats?.metrics?.map((metric: any, i: number) => {
          let icon = Users;
          let color = "text-blue-600 dark:text-blue-400";
          let bg = "bg-blue-500/10";
          let cardBg = "bg-card";
          
          if (metric.title.includes('Present')) { icon = UserCheck; color = "text-emerald-600 dark:text-emerald-400"; bg = "bg-emerald-500/10"; }
          if (metric.title.includes('Pending')) { icon = AlertCircle; color = "text-rose-600 dark:text-rose-400"; bg = "bg-rose-500/10"; }
          if (metric.title.includes('Leave')) { icon = CalendarDays; color = "text-amber-600 dark:text-amber-400"; bg = "bg-amber-500/10"; }

          const destination = getKPIDestination(metric.title);

          return (
            <KPICard 
              key={i} 
              title={t(metric.title)} 
              value={metric.value} 
              trend={metric.trend}
              icon={icon}
              colorClass={color}
              bgClass={bg}
              cardBgClass={cardBg}
              onClick={() => router.push(destination)}
            />
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column - Enterprise My Team Members Card (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          <div className="rounded-2xl border bg-card shadow-xs p-4 sm:p-5 transition-all duration-200 hover:shadow-md">
            
            {/* Header Title & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground tracking-tight">{t("My Team Members")}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {totalAssigned} Members
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Real-time workforce attendance & status overview")}
                </p>
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-primary hover:text-primary font-semibold flex items-center gap-1 self-start sm:self-auto h-8 px-2.5"
                onClick={() => router.push('/dashboard/employee-management')}
              >
                {t("View All Team")} <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Attendance Analytics Bar & Pills */}
            <div className="py-3 space-y-2.5 border-b">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{t("Present:")} <strong>{presentCount}</strong> ({presentPct}%)</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>{t("Absent:")} <strong>{absentCount}</strong> ({absentPct}%)</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>{t("On Leave:")} <strong>{leaveCount}</strong> ({leavePct}%)</span>
                  </div>
                </div>
              </div>

              {/* Multi-segmented attendance progress bar */}
              <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden flex">
                <div style={{ width: `${presentPct}%` }} className="h-full bg-emerald-500 transition-all duration-500" title={`Present: ${presentPct}%`} />
                <div style={{ width: `${leavePct}%` }} className="h-full bg-amber-500 transition-all duration-500" title={`On Leave: ${leavePct}%`} />
                <div style={{ width: `${absentPct}%` }} className="h-full bg-rose-500 transition-all duration-500" title={`Absent: ${absentPct}%`} />
              </div>
            </div>

            {/* Filter Toolbar & Search */}
            <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder={t("Search team member...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>

              {/* Status Tabs - Scrollbar Completely Hidden via custom utility */}
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setAttendanceFilter("ALL")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    attendanceFilter === "ALL" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("All")} ({teamMembers.length})
                </button>
                <button
                  onClick={() => setAttendanceFilter("PRESENT")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    attendanceFilter === "PRESENT" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Present")} ({presentCount})
                </button>
                <button
                  onClick={() => setAttendanceFilter("ABSENT")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    attendanceFilter === "ABSENT" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Absent")} ({absentCount})
                </button>
                <button
                  onClick={() => setAttendanceFilter("ON_LEAVE")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    attendanceFilter === "ON_LEAVE" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("On Leave")} ({leaveCount})
                </button>
              </div>
            </div>

            {/* Team Table - Scaled & Formatted for Enterprise Fit Without Horizontal Scroll */}
            <div className="overflow-x-auto mt-1 border rounded-xl">
              <table className="w-full text-left table-fixed">
                <thead className="bg-muted/30 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-2.5 w-[16%]">{t("Employee ID")}</th>
                    <th className="py-2 px-2.5 w-[28%]">{t("Name")}</th>
                    <th className="py-2 px-2.5 w-[18%]">{t("Department")}</th>
                    <th className="py-2 px-2.5 w-[15%]">{t("Designation")}</th>
                    <th className="py-2 px-2.5 w-[13%]">{t("Today's Status")}</th>
                    <th className="py-2 px-2.5 w-[10%] text-right">{t("Account")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]">
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                        {t("No team members found matching criteria.")}
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((emp: any) => {
                      let statusBadge = (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          ABSENT
                        </span>
                      );

                      if (emp.todayStatus === "PRESENT") {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            PRESENT
                          </span>
                        );
                      } else if (emp.todayStatus === "ON_LEAVE") {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            ON LEAVE
                          </span>
                        );
                      }

                      return (
                        <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-2.5 font-mono text-[10px] font-bold text-muted-foreground truncate">
                            {emp.employeeId || 'N/A'}
                          </td>
                          <td className="py-2 px-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0 border border-primary/20">
                                {emp.firstName?.charAt(0) || 'E'}
                              </div>
                              <div className="flex flex-col min-w-0 truncate">
                                <span className="font-bold text-xs text-foreground truncate">{emp.firstName} {emp.lastName}</span>
                                <span className="text-[9px] text-muted-foreground truncate">{emp.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-2.5 text-[11px] text-muted-foreground truncate">
                            {emp.department?.name || 'Unassigned'}
                          </td>
                          <td className="py-2 px-2.5 text-[11px] text-muted-foreground truncate">
                            {emp.designation?.name || 'Associate'}
                          </td>
                          <td className="py-2 px-2.5">
                            {statusBadge}
                          </td>
                          <td className="py-2 px-2.5 text-right">
                            <Badge className={emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 text-[9px] px-1.5 py-0' : 'bg-gray-100 text-gray-700 text-[9px] px-1.5 py-0'}>
                              {emp.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Enterprise Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-1 border-t text-xs">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>
                  {t("Showing")} <strong className="text-foreground">{totalItems > 0 ? startIndex + 1 : 0}</strong> {t("to")}{" "}
                  <strong className="text-foreground">{endIndex}</strong> {t("of")}{" "}
                  <strong className="text-foreground">{totalItems}</strong> {t("members")}
                </span>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground hidden sm:inline">| {t("Rows per page")}:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-7 px-2 py-0 border rounded-lg bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary border-input cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-1">
                  {t("Page")} <strong className="text-foreground">{currentPage}</strong> {t("of")} <strong className="text-foreground">{totalPages}</strong>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0 rounded-lg"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-7 w-7 p-0 rounded-lg"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (4 Columns) - Pending Approvals & Recent Team Activity */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <PendingTasks tasks={stats?.pendingTasks || []} />
          <TeamActivityCard activities={stats?.recentActivities || []} />
        </div>
      </div>
    </div>
  );
}
