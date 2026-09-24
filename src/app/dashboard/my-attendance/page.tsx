"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Download, FilterX, RefreshCcw, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { KPICards } from './components/KPICards';
import { AttendanceTable } from './components/AttendanceTable';
import { AttendanceCharts } from './components/AttendanceCharts';
import { AttendancePunchWidget } from '@/components/shared/AttendancePunchWidget';
import { exportAttendanceToExcel, exportAttendanceToCSV } from '@/lib/attendanceExporter';

export default function MyAttendancePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [breakTypeFilter, setBreakTypeFilter] = useState("ALL");

  // Summary API (KPIs)
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance_summary'],
    queryFn: async () => (await api.get('/attendance/my/summary')).data.data
  });

  // Charts API (Analytics)
  const { data: chartsData, isLoading: chartsLoading } = useQuery({
    queryKey: ['attendance_charts'],
    queryFn: async () => (await api.get('/attendance/my/charts')).data.data
  });

  // List API (Table)
  const { data: records, isLoading: recordsLoading, isFetching: recordsFetching } = useQuery({
    queryKey: ['my_attendance'],
    queryFn: async () => (await api.get('/attendance/my')).data.data
  });

  const clearFilters = () => {
    setSearchTerm("");
    setPeriodFilter("");
    setStatusFilter("ALL");
    setBreakTypeFilter("ALL");
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['my_attendance'] });
  };

  const filteredRecords = (records || []).filter((item: any) => {
    let matchesPeriod = true;
    if (periodFilter) {
      const [year, month] = periodFilter.split('-');
      const itemDate = new Date(item.date);
      matchesPeriod = itemDate.getFullYear() === parseInt(year) && (itemDate.getMonth() + 1) === parseInt(month);
    }

    const logs = [...(item.logs || [])].sort((a: any, b: any) => new Date(a.punchIn).getTime() - new Date(b.punchIn).getTime());
    const isPunchedIn = logs.length > 0 && !logs[logs.length - 1].punchOut;
    const computedStatus = isPunchedIn ? "YET TO Punch Out" : item.status;
    const matchesStatus = statusFilter === "ALL" || computedStatus === statusFilter;

    let matchesBreakType = true;
    if (breakTypeFilter !== "ALL") {
      matchesBreakType = (item.breaks || []).some((b: any) => {
        const type = (b.type || "LUNCH").toUpperCase();
        return type === breakTypeFilter || (breakTypeFilter === "OTHER" && (!b.type || b.type === "OTHER"));
      });
    }

    let matchesSearch = true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const dateStr = format(new Date(item.date), 'dd MMM yyyy').toLowerCase();
      const statusStr = computedStatus.toLowerCase();
      matchesSearch = dateStr.includes(term) || statusStr.includes(term);
    }

    return matchesPeriod && matchesStatus && matchesBreakType && matchesSearch;
  });

  const handleExportExcel = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast.error("No records to export");
      return;
    }
    exportAttendanceToExcel(filteredRecords, "Employee");
  };

  const handleExportCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast.error("No records to export");
      return;
    }
    exportAttendanceToCSV(filteredRecords);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pt-2 sm:pt-4 pb-10">
      <PageHeader
        title={t("My Attendance")}
        description={t("Track your working hours, daily timeline, and attendance metrics.")}
        showCreate={false}
        showSearch={false}
      />

      <KPICards summaryData={summaryData} summaryLoading={summaryLoading} />

      {/* Filter Toolbar */}
      <div className="bg-card rounded-xl border shadow-sm p-4 sticky top-0 z-20">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by date or status..."
              className="pl-9 h-10 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input
            type="month"
            className="h-10 rounded-md border bg-card px-3 py-2 text-sm shadow-sm w-full md:w-[170px] focus:ring-2 focus:ring-primary focus:outline-none"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          />
          <select
            className="h-10 rounded-md border bg-card px-3 py-2 text-sm shadow-sm w-full md:w-[170px] focus:ring-2 focus:ring-primary focus:outline-none font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="YET TO Punch Out">Yet to Check Out</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="LEAVE">On Leave</option>
          </select>

          {/* Enterprise Break Type Filter Dropdown */}
          <select
            className="h-10 rounded-md border bg-card px-3 py-2 text-sm shadow-sm w-full md:w-[190px] focus:ring-2 focus:ring-primary focus:outline-none font-medium text-foreground"
            value={breakTypeFilter}
            onChange={(e) => setBreakTypeFilter(e.target.value)}
          >
            <option value="ALL">All Break Types</option>
            <option value="LUNCH">🍱 Lunch Break</option>
            <option value="TEA">☕ Tea / Coffee Break</option>
            <option value="BIO">🚻 Bio Break</option>
            <option value="OFFICIAL">💼 Official Call</option>
            <option value="OTHER">⏱ Quick Break</option>
          </select>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button variant="outline" size="icon" onClick={clearFilters} title="Clear Filters" className="h-10 w-10 shrink-0">
              <FilterX className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={refreshData} title="Refresh" className="h-10 w-10 shrink-0" isLoading={recordsFetching}>
              <RefreshCcw className="h-4 w-4" />
            </Button>

            {/* Enterprise Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="h-10 font-semibold gap-1.5 shadow-sm">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5 shadow-xl">
                <DropdownMenuItem
                  onClick={handleExportExcel}
                  className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-lg text-xs font-semibold focus:bg-emerald-50 focus:text-emerald-900 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Export Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportCSV}
                  className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-lg text-xs font-semibold focus:bg-slate-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Export CSV (.csv)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AttendanceTable records={filteredRecords} isLoading={recordsLoading} />
    </div>
  );
}

