"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

import { AttendancePunchWidget } from "@/components/shared/AttendancePunchWidget";

// New Enterprise Attendance Components
import { AttendanceKpiCards } from "@/components/attendance/AttendanceKpiCards";
import { AttendanceFilters } from "@/components/attendance/AttendanceFilters";
import { AttendanceTable, AttendanceRecordDto } from "@/components/attendance/AttendanceTable";
import { AttendanceDetailDrawer } from "@/components/attendance/AttendanceDetailDrawer";
import { AttendanceCorrectionModal } from "@/components/attendance/AttendanceCorrectionModal";
import { AttendancePunchModal } from "@/components/attendance/AttendancePunchModal";

export default function AttendancePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState("TODAY");
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [departmentId, setDepartmentId] = useState("ALL");
  const [designationId, setDesignationId] = useState("ALL");
  const [shiftId, setShiftId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [breakType, setBreakType] = useState("ALL");
  const [page, setPage] = useState(1);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    date: true,
    employee: true,
    employeeId: true,
    status: true,
    punchIn: true,
    punchOut: true,
    sessionEnded: true,
    lunch: true,
    tea: true,
    bio: true,
    official: true,
    personal: true,
    breakTime: true,
    workingHours: true,
    shift: true
  });

  // Modal / Drawer States
  const [viewRecord, setViewRecord] = useState<AttendanceRecordDto | null>(null);
  const [correctRecord, setCorrectRecord] = useState<AttendanceRecordDto | null>(null);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch Summary KPI Metrics (updated according to selected date/range)
  const { data: summaryRes, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["adminAttendanceSummary", datePreset, singleDate, startDate, endDate],
    queryFn: async () => (await api.get("/attendance/admin/summary", {
      params: { datePreset, singleDate, startDate, endDate }
    })).data,
    refetchInterval: 15000 // auto-refresh every 15s for live metrics
  });

  // 2. Fetch Admin Attendance Records
  const { data: recordsRes, isLoading: isRecordsLoading, isRefetching } = useQuery({
    queryKey: [
      "adminAttendanceRecords",
      search,
      datePreset,
      singleDate,
      startDate,
      endDate,
      departmentId,
      designationId,
      shiftId,
      status,
      breakType,
      page
    ],
    queryFn: async () => {
      const res = await api.get("/attendance/admin/records", {
        params: {
          search,
          datePreset,
          singleDate,
          startDate,
          endDate,
          departmentId,
          designationId,
          shiftId,
          status,
          breakType,
          page,
          limit: 50
        }
      });
      return res.data;
    }
  });

  // Metadata Queries
  const { data: departmentsRes } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get("/departments")).data,
  });

  const { data: designationsRes } = useQuery({
    queryKey: ["designations"],
    queryFn: async () => (await api.get("/designations")).data,
  });

  const { data: employeesRes } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get("/employees")).data,
  });

  const { data: shiftsRes } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => (await api.get("/shifts")).data,
  });

  const summary = summaryRes?.data || null;
  const records: AttendanceRecordDto[] = recordsRes?.data?.records || [];
  const pagination = recordsRes?.data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };
  const departments = departmentsRes?.data || [];
  const designations = designationsRes?.data || [];
  const employees = employeesRes?.data || [];
  const shifts = shiftsRes?.data || [];

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setDatePreset("TODAY");
    setSingleDate(new Date().toISOString().split('T')[0]);
    setStartDate("");
    setEndDate("");
    setDepartmentId("ALL");
    setDesignationId("ALL");
    setShiftId("ALL");
    setStatus("ALL");
    setBreakType("ALL");
    setPage(1);
  };

  // Refresh All Data
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["adminAttendanceSummary"] });
    queryClient.invalidateQueries({ queryKey: ["adminAttendanceRecords"] });
  };

  // Export Excel File
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/attendance/admin/export', {
        params: {
          search,
          datePreset,
          singleDate,
          startDate,
          endDate,
          departmentId,
          designationId,
          shiftId,
          status,
          breakType
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `HRMS_Attendance_Report_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert("Failed to export Excel report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // HR Direct Punch In Action
  const handleHRPunchIn = async (data: { employeeId: string; date?: string; punchInTime?: string; reason?: string }) => {
    await api.post("/attendance/admin/punch-in", data);
    handleRefresh();
  };

  // HR Direct Punch Out Action
  const handleHRPunchOut = async (rec: AttendanceRecordDto) => {
    const empName = rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : rec.employeeId;
    if (confirm(`Are you sure you want to punch out ${empName}?`)) {
      try {
        await api.post("/attendance/admin/punch-out", {
          attendanceId: rec.id,
          employeeId: rec.employee?.id || rec.employeeId
        });
        handleRefresh();
      } catch (error: any) {
        alert(error?.response?.data?.message || "Failed to punch out employee.");
      }
    }
  };

  // HR Resume Work Action
  const handleHRResumeWork = async (rec: AttendanceRecordDto) => {
    const empName = rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : rec.employeeId;
    if (confirm(`Resume work session for ${empName}?`)) {
      try {
        await api.post("/attendance/admin/resume", {
          attendanceId: rec.id,
          employeeId: rec.employee?.id || rec.employeeId
        });
        handleRefresh();
      } catch (error: any) {
        alert(error?.response?.data?.message || "Failed to resume work session.");
      }
    }
  };

  // HR Attendance Correction Action
  const handleHRCorrection = async (data: {
    attendanceRecordId: string;
    employeeId: string;
    date: string;
    punchIn: string;
    punchOut: string;
    status: string;
    reason: string;
  }) => {
    await api.post("/attendance/admin/correct", data);
    handleRefresh();
  };



  return (
    <div className="flex flex-col gap-5">
      {/* Enterprise Header */}
      <PageHeader
        title="Attendance Management"
        description="Monitor employee attendance, working sessions, breaks and daily workforce activity."
        showSearch={false}
        actionButton={
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              title="Refresh"
              className="h-9 px-2.5 sm:px-3 gap-1.5 text-xs font-medium shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              title="Export"
              className="h-9 px-2.5 sm:px-3 gap-1.5 text-xs font-medium border-emerald-300 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export"}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPunchModalOpen(true)}
              className="h-9 px-2.5 sm:px-3 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground flex-1 sm:flex-initial whitespace-nowrap justify-center"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add Attendance</span>
            </Button>
          </div>
        }
      />

      {/* Main Attendance Management Content */}
      <div className="space-y-5">
        {/* KPI Summary Cards */}
        <AttendanceKpiCards summary={summary} isLoading={isSummaryLoading} />

        {/* Filter Bar */}
        <AttendanceFilters
          search={search}
          setSearch={setSearch}
          datePreset={datePreset}
          setDatePreset={setDatePreset}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          departmentId={departmentId}
          setDepartmentId={setDepartmentId}
          designationId={designationId}
          setDesignationId={setDesignationId}
          shiftId={shiftId}
          setShiftId={setShiftId}
          status={status}
          setStatus={setStatus}
          breakType={breakType}
          setBreakType={setBreakType}
          departments={departments}
          designations={designations}
          shifts={shifts}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onReset={handleResetFilters}
          onRefresh={handleRefresh}
          onExport={handleExportExcel}
          isExporting={isExporting}
        />

        {/* Main 16-Column Attendance Table */}
        <AttendanceTable
          records={records}
          isLoading={isRecordsLoading}
          visibleColumns={visibleColumns}
          onView={rec => setViewRecord(rec)}
          onPunchIn={rec => handleHRPunchIn({ employeeId: rec.employee?.id || rec.employeeId })}
          onPunchOut={rec => handleHRPunchOut(rec)}
          onResume={rec => handleHRResumeWork(rec)}
          onCorrect={rec => setCorrectRecord(rec)}
        />

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 px-1">
            <span>
              Showing <strong>{((pagination.page - 1) * pagination.limit) + 1}</strong> to <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> of <strong>{pagination.total}</strong> records
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-8 px-3 text-xs"
              >
                Previous
              </Button>
              <span className="font-semibold text-foreground">Page {pagination.page} of {pagination.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-8 px-3 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Detail Drawer */}
      <AttendanceDetailDrawer
        record={viewRecord}
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
      />

      {/* Correction Modal */}
      <AttendanceCorrectionModal
        record={correctRecord}
        open={!!correctRecord}
        onClose={() => setCorrectRecord(null)}
        onSubmit={handleHRCorrection}
      />

      {/* HR Punch In Modal */}
      <AttendancePunchModal
        open={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        employees={employees}
        onSubmitPunchIn={handleHRPunchIn}
      />
    </div>
  );
}
