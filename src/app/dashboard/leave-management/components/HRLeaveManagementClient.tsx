"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  Briefcase,
  CalendarDays,
  RefreshCw,
  Download,
  Settings,
  Plus,
  Search,
  Eye,
  Check,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Edit,
  Trash2,
  FileText,
  UserCheck,
  Building2,
  History,
} from "lucide-react";
import { format } from "date-fns";

export function HRLeaveManagementClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Filters State
  const [requestSearch, setRequestSearch] = useState("");
  const [requestDeptFilter, setRequestDeptFilter] = useState("ALL");
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");

  const [balanceSearch, setBalanceSearch] = useState("");
  const [balanceDeptFilter, setBalanceDeptFilter] = useState("ALL");

  // Modals & Drawers State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [approvalError, setApprovalError] = useState("");

  const [isManageBalanceOpen, setIsManageBalanceOpen] = useState(false);
  const [selectedBalanceEmp, setSelectedBalanceEmp] = useState<any | null>(null);
  const [annualBal, setAnnualBal] = useState(18);
  const [casualBal, setCasualBal] = useState(8);
  const [medicalBal, setMedicalBal] = useState(10);
  const [earnedBal, setEarnedBal] = useState(5);
  const [compOffBal, setCompOffBal] = useState(0);
  const [balanceReason, setBalanceReason] = useState("");
  const [balanceError, setBalanceError] = useState("");

  const [isAddLeaveTypeOpen, setIsAddLeaveTypeOpen] = useState(false);
  const [leaveTypeName, setLeaveTypeName] = useState("");
  const [leaveTypeCode, setLeaveTypeCode] = useState("");
  const [leaveTypeDesc, setLeaveTypeDesc] = useState("");
  const [leaveTypeCategory, setLeaveTypeCategory] = useState("PAID");
  const [leaveTypeDefaultAlloc, setLeaveTypeDefaultAlloc] = useState(12);
  const [leaveTypeAccrual, setLeaveTypeAccrual] = useState("ANNUAL");
  const [leaveTypeCarryForward, setLeaveTypeCarryForward] = useState(false);
  const [leaveTypeMaxCarry, setLeaveTypeMaxCarry] = useState(0);
  const [leaveTypeEncashable, setLeaveTypeEncashable] = useState(false);
  const [leaveTypeError, setLeaveTypeError] = useState("");

  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayType, setHolidayType] = useState("NATIONAL");
  const [holidayDesc, setHolidayDesc] = useState("");
  const [holidayError, setHolidayError] = useState("");

  // FETCH DATA
  const { data: hrSummary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["hrLeaveSummary"],
    queryFn: async () => (await api.get("/leaves/summary")).data.data,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get("/departments")).data.data || [],
  });

  const { data: allRequests = [], isLoading: isRequestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ["allLeaveRequests", requestStatusFilter, requestDeptFilter],
    queryFn: async () =>
      (await api.get(`/leaves?status=${requestStatusFilter}&departmentId=${requestDeptFilter}`)).data.data || [],
  });

  const { data: employeeBalances = [], isLoading: isBalancesLoading, refetch: refetchBalances } = useQuery({
    queryKey: ["employeeBalances", balanceDeptFilter],
    queryFn: async () => (await api.get(`/leaves/balances?departmentId=${balanceDeptFilter}`)).data.data || [],
  });

  const { data: leaveTypes = [], refetch: refetchLeaveTypes } = useQuery({
    queryKey: ["leaveTypes"],
    queryFn: async () => (await api.get("/leaves/types")).data.data || [],
  });

  const { data: leavePolicies = [], refetch: refetchPolicies } = useQuery({
    queryKey: ["leavePolicies"],
    queryFn: async () => (await api.get("/leaves/policies")).data.data || [],
  });

  const { data: calendarData, refetch: refetchCalendar } = useQuery({
    queryKey: ["leaveCalendar"],
    queryFn: async () => (await api.get("/leaves/calendar")).data.data,
  });

  const { data: ledgerLogs = [] } = useQuery({
    queryKey: ["leaveLedger"],
    queryFn: async () => (await api.get("/leaves/ledger")).data.data || [],
  });

  // MUTATIONS
  const approvalMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: string; status: string; comments: string }) => {
      const res = await api.put(`/leaves/${id}/status`, { status, comments });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrLeaveSummary"] });
      queryClient.invalidateQueries({ queryKey: ["allLeaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["employeeBalances"] });
      setIsApprovalModalOpen(false);
      setApprovalComment("");
      setApprovalError("");
    },
    onError: (err: any) => {
      setApprovalError(err.response?.data?.message || "Failed to update status.");
    },
  });

  const balanceMutation = useMutation({
    mutationFn: async ({ employeeId, payload }: { employeeId: string; payload: any }) => {
      const res = await api.put(`/leaves/balances/${employeeId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeBalances"] });
      setIsManageBalanceOpen(false);
      setBalanceReason("");
      setBalanceError("");
    },
    onError: (err: any) => {
      setBalanceError(err.response?.data?.message || "Failed to update balance.");
    },
  });

  const createLeaveTypeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/leaves/types", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveTypes"] });
      setIsAddLeaveTypeOpen(false);
      setLeaveTypeName("");
      setLeaveTypeCode("");
      setLeaveTypeDesc("");
      setLeaveTypeError("");
    },
    onError: (err: any) => {
      setLeaveTypeError(err.response?.data?.message || "Failed to create leave type.");
    },
  });

  const createHolidayMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/holidays", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveCalendar"] });
      setIsAddHolidayOpen(false);
      setHolidayName("");
      setHolidayDate("");
      setHolidayDesc("");
      setHolidayError("");
    },
    onError: (err: any) => {
      setHolidayError(err.response?.data?.message || "Failed to add holiday.");
    },
  });

  const handleRefreshAll = () => {
    refetchSummary();
    refetchRequests();
    refetchBalances();
    refetchLeaveTypes();
    refetchPolicies();
    refetchCalendar();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const dataToExport = allRequests.map((r: any) => ({
      "Request ID": `LR-${r.id.slice(0, 8).toUpperCase()}`,
      Employee: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "N/A",
      "Employee ID": r.employee?.employeeId || "N/A",
      Department: r.employee?.department?.name || "N/A",
      Designation: r.employee?.designation?.name || "N/A",
      "Leave Type": r.leaveType,
      "Start Date": format(new Date(r.startDate), "yyyy-MM-dd"),
      "End Date": format(new Date(r.endDate), "yyyy-MM-dd"),
      Status: r.status,
      "Applied On": format(new Date(r.createdAt), "yyyy-MM-dd HH:mm"),
      Description: (r.description || "").replace(/"/g, '""'),
    }));

    if (dataToExport.length === 0) return;
    const headers = Object.keys(dataToExport[0]).join(",");
    const rows = dataToExport.map((row: any) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HRMS_Leave_Requests_Report_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Requests Table
  const filteredRequests = allRequests.filter((r: any) => {
    if (!requestSearch.trim()) return true;
    const q = requestSearch.toLowerCase();
    const empName = r.employee ? `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase() : "";
    const empId = (r.employee?.employeeId || "").toLowerCase();
    const typeMatch = (r.leaveType || "").toLowerCase().includes(q);
    return empName.includes(q) || empId.includes(q) || typeMatch;
  });

  // Filter Balances Table
  const filteredBalances = employeeBalances.filter((b: any) => {
    if (!balanceSearch.trim()) return true;
    const q = balanceSearch.toLowerCase();
    const nameMatch = (b.name || "").toLowerCase().includes(q);
    const empId = (b.employeeId || "").toLowerCase();
    const deptMatch = (b.department || "").toLowerCase().includes(q);
    return nameMatch || empId.includes(q) || deptMatch;
  });

  const kpis = hrSummary?.summary || {
    totalEmployees: 2022,
    pendingRequests: 0,
    approvedThisMonth: 0,
    onLeaveToday: 0,
    availableLeaveTypes: 6,
    upcomingHolidays: 0,
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6">
      {/* Header */}
      <PageHeader
        title="Leave Management"
        description="Configure leave policies, manage employee balances, review requests and maintain the organization's leave calendar."
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => setIsAddLeaveTypeOpen(true)} className="h-9 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Leave Type
            </Button>
          </div>
        }
      />

      {/* Database KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3 px-2.5 sm:px-3">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{isSummaryLoading ? "..." : kpis.totalEmployees}</div>
            <span className="text-[10px] text-muted-foreground">Active Staff</span>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3 px-2.5 sm:px-3">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-amber-600">{isSummaryLoading ? "..." : kpis.pendingRequests}</div>
            <span className="text-[10px] text-muted-foreground">Action Required</span>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3 px-2.5 sm:px-3">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Approved (Month)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{isSummaryLoading ? "..." : kpis.approvedThisMonth}</div>
            <span className="text-[10px] text-muted-foreground">This Month</span>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3 px-2.5 sm:px-3">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              On Leave Today
            </CardTitle>
            <UserCheck className="h-4 w-4 text-rose-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-rose-600">{isSummaryLoading ? "..." : kpis.onLeaveToday}</div>
            <span className="text-[10px] text-muted-foreground">Absent Today</span>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3 px-2.5 sm:px-3">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Leave Types
            </CardTitle>
            <Briefcase className="h-4 w-4 text-purple-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{isSummaryLoading ? "..." : kpis.availableLeaveTypes}</div>
            <span className="text-[10px] text-muted-foreground">Configured</span>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3 px-2.5 sm:px-3">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Upcoming Holidays
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-indigo-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{isSummaryLoading ? "..." : kpis.upcomingHolidays}</div>
            <span className="text-[10px] text-muted-foreground">Calendar Events</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl w-full flex-wrap justify-start h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold">
            Overview
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-lg text-xs font-semibold">
            Leave Requests ({allRequests.length})
          </TabsTrigger>
          <TabsTrigger value="balances" className="rounded-lg text-xs font-semibold">
            Leave Balances ({employeeBalances.length})
          </TabsTrigger>
          <TabsTrigger value="types" className="rounded-lg text-xs font-semibold">
            Leave Types ({leaveTypes.length})
          </TabsTrigger>
          <TabsTrigger value="policies" className="rounded-lg text-xs font-semibold">
            Policies
          </TabsTrigger>
          <TabsTrigger value="holidays" className="rounded-lg text-xs font-semibold">
            Holidays
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg text-xs font-semibold">
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Utilization Summary */}
            <Card className="border shadow-xs lg:col-span-2">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Leave Utilization Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Annual Leave (AL)</span>
                      <span>72% Utilized</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: "72%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Casual Leave (CL)</span>
                      <span>48% Utilized</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: "48%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Medical Leave (ML)</span>
                      <span>31% Utilized</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-rose-600 rounded-full" style={{ width: "31%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Earned Leave (EL)</span>
                      <span>25% Utilized</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: "25%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Holidays Widget */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-indigo-600" />
                  Upcoming Holidays
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {calendarData?.holidays && calendarData.holidays.length > 0 ? (
                  calendarData.holidays.map((h: any) => (
                    <div key={h.id} className="p-2.5 border rounded-lg flex items-center gap-3 bg-gray-50/50">
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-700 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold">{format(new Date(h.date), "dd")}</span>
                        <span className="text-[8px] uppercase font-semibold">{format(new Date(h.date), "MMM")}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-gray-900 truncate">{h.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{h.type || "National"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground p-4 text-center">No upcoming holidays scheduled.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Approval List in Overview */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Pending Approvals Requiring Action
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("requests")} className="text-xs">
                View All Requests
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRequests.filter((r: any) => r.status === "PENDING").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                        No pending leave requests requiring approval.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allRequests
                      .filter((r: any) => r.status === "PENDING")
                      .slice(0, 5)
                      .map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-semibold text-xs">
                            {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "N/A"}
                            <span className="text-[10px] text-muted-foreground block font-mono">{r.employee?.employeeId}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                              {r.leaveType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {format(new Date(r.startDate), "dd MMM")} - {format(new Date(r.endDate), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-xs">{r.description || "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50"
                                onClick={() => {
                                  setApprovalTarget({ id: r.id, action: "APPROVED" });
                                  setIsApprovalModalOpen(true);
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                  setApprovalTarget({ id: r.id, action: "REJECTED" });
                                  setIsApprovalModalOpen(true);
                                }}
                              >
                                <X className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: LEAVE REQUESTS MASTER TABLE */}
        <TabsContent value="requests" className="space-y-4 mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className="h-9 px-3 py-1 border rounded-lg text-xs bg-background"
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                className="h-9 px-3 py-1 border rounded-lg text-xs bg-background"
                value={requestDeptFilter}
                onChange={(e) => setRequestDeptFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or ID..."
                className="pl-9 h-9 text-xs rounded-lg"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
              />
            </div>
          </div>

          <Card className="border shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-28">Request ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isRequestsLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                        No leave requests found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((r: any) => (
                      <TableRow key={r.id} className="hover:bg-muted/10">
                        <TableCell className="font-mono text-xs font-semibold">
                          LR-{r.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-semibold text-xs">
                          {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "N/A"}
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            {r.employee?.employeeId}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{r.employee?.department?.name || "Unassigned"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                            {r.leaveType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{format(new Date(r.startDate), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-xs">{format(new Date(r.endDate), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          {r.status === "APPROVED" && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-xs">Approved</Badge>
                          )}
                          {r.status === "PENDING" && (
                            <Badge className="bg-amber-500/15 text-amber-700 border-0 text-xs">Pending</Badge>
                          )}
                          {r.status === "REJECTED" && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
                          {r.status === "CANCELLED" && <Badge variant="secondary" className="text-xs">Cancelled</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(r.createdAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => {
                                  setApprovalTarget({ id: r.id, action: "APPROVED" });
                                  setIsApprovalModalOpen(true);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                                onClick={() => {
                                  setApprovalTarget({ id: r.id, action: "REJECTED" });
                                  setIsApprovalModalOpen(true);
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Processed</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: LEAVE BALANCES */}
        <TabsContent value="balances" className="space-y-4 mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <select
              className="h-9 px-3 py-1 border rounded-lg text-xs bg-background"
              value={balanceDeptFilter}
              onChange={(e) => setBalanceDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee by name, ID or dept..."
                className="pl-9 h-9 text-xs rounded-lg"
                value={balanceSearch}
                onChange={(e) => setBalanceSearch(e.target.value)}
              />
            </div>
          </div>

          <Card className="border shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Annual</TableHead>
                    <TableHead>Casual</TableHead>
                    <TableHead>Medical</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Total Used</TableHead>
                    <TableHead>Total Remaining</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isBalancesLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                        No employee leave balances found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBalances.map((b: any) => (
                      <TableRow key={b.id} className="hover:bg-muted/10">
                        <TableCell className="font-semibold text-xs">
                          {b.name}
                          <span className="text-[10px] text-muted-foreground block font-mono">{b.employeeId}</span>
                        </TableCell>
                        <TableCell className="text-xs">{b.department}</TableCell>
                        <TableCell className="text-xs">
                          {b.balances?.annual?.remaining} / {b.balances?.annual?.allocated}
                        </TableCell>
                        <TableCell className="text-xs">
                          {b.balances?.casual?.remaining} / {b.balances?.casual?.allocated}
                        </TableCell>
                        <TableCell className="text-xs">
                          {b.balances?.medical?.remaining} / {b.balances?.medical?.allocated}
                        </TableCell>
                        <TableCell className="text-xs">
                          {b.balances?.earned?.remaining} / {b.balances?.earned?.allocated}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-amber-700">{b.summary?.used || 0} Days</TableCell>
                        <TableCell className="text-xs font-extrabold text-emerald-700">{b.summary?.remaining || 0} Days</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              setSelectedBalanceEmp(b);
                              setAnnualBal(b.balances?.annual?.allocated || 18);
                              setCasualBal(b.balances?.casual?.allocated || 8);
                              setMedicalBal(b.balances?.medical?.allocated || 10);
                              setEarnedBal(b.balances?.earned?.allocated || 5);
                              setCompOffBal(b.balances?.compOff?.allocated || 0);
                              setIsManageBalanceOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Manage Balance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: MASTER LEAVE TYPES */}
        <TabsContent value="types" className="space-y-4 mt-0">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Master leave types configured for employee eligibility and leave calculations.
            </p>
            <Button size="sm" onClick={() => setIsAddLeaveTypeOpen(true)} className="h-9 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Leave Type
            </Button>
          </div>

          <Card className="border shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Default Allocation</TableHead>
                    <TableHead>Accrual</TableHead>
                    <TableHead>Carry Forward</TableHead>
                    <TableHead>Encashable</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-semibold text-xs">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {t.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {t.category || "PAID"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{t.defaultAllocation} Days</TableCell>
                      <TableCell className="text-xs">{t.accrualType || "ANNUAL"}</TableCell>
                      <TableCell className="text-xs">
                        {t.carryForwardEnabled ? `Yes (Max ${t.maxCarryForward})` : "No"}
                      </TableCell>
                      <TableCell className="text-xs">{t.encashmentEnabled ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        {t.status ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-xs">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: POLICIES */}
        <TabsContent value="policies" className="space-y-4 mt-0">
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Organization Leave Policies & Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {leavePolicies.map((p: any) => (
                <div key={p.id} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 p-4 border rounded-xl bg-gray-50/50">
                      <Label className="text-xs font-bold text-gray-900">Working Days Pattern</Label>
                      <p className="text-xs text-muted-foreground">{p.workingDays?.join(", ") || "Monday to Friday"}</p>
                    </div>

                    <div className="space-y-2 p-4 border rounded-xl bg-gray-50/50">
                      <Label className="text-xs font-bold text-gray-900">Leave Calendar Year</Label>
                      <p className="text-xs text-muted-foreground">{p.leaveYear || "January to December"}</p>
                    </div>

                    <div className="space-y-2 p-4 border rounded-xl bg-gray-50/50">
                      <Label className="text-xs font-bold text-gray-900">Notice Period & Max Consecutive</Label>
                      <p className="text-xs text-muted-foreground">Notice: {p.noticePeriodDays || 1} day • Max consecutive: {p.maxConsecutiveDays || 15} days</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Leave Calculation Rules</h4>
                      <ul className="space-y-2 text-xs text-gray-700">
                        <li className="flex items-center justify-between">
                          <span>Half-Day Request Support:</span>
                          <span className="font-semibold text-emerald-700">{p.allowHalfDay ? "Enabled" : "Disabled"}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Exclude Weekends from Duration:</span>
                          <span className="font-semibold text-emerald-700">{p.excludeWeekends ? "Yes" : "No"}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Exclude Holidays from Duration:</span>
                          <span className="font-semibold text-emerald-700">{p.excludeHolidays ? "Yes" : "No"}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Negative Balance Allowed:</span>
                          <span className="font-semibold text-rose-700">{p.allowNegativeBalance ? "Allowed" : "Disabled"}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Approval & Restrictions</h4>
                      <ul className="space-y-2 text-xs text-gray-700">
                        <li className="flex items-center justify-between">
                          <span>Approval Hierarchy:</span>
                          <span className="font-semibold text-blue-700">{p.approvalHierarchy || "Manager -> HR"}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Probation Leave Restrictions:</span>
                          <span className="font-semibold text-amber-700">{p.restrictProbation ? "Restricted" : "Unrestricted"}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Carry Forward Policy:</span>
                          <span className="font-semibold text-emerald-700">{p.carryForwardEnabled ? "Active" : "Inactive"}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: HOLIDAYS */}
        <TabsContent value="holidays" className="space-y-4 mt-0">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Company holiday calendar automatically reflected on employee portals.
            </p>
            <Button size="sm" onClick={() => setIsAddHolidayOpen(true)} className="h-9 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          </div>

          <Card className="border shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Date</TableHead>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calendarData?.holidays && calendarData.holidays.length > 0 ? (
                    calendarData.holidays.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-bold text-xs">{format(new Date(h.date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="font-semibold text-xs">{h.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">
                            {h.type || "NATIONAL"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.description || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                        No holidays added to the calendar yet. Click &quot;Add Holiday&quot; above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 7: AUDIT LOG */}
        <TabsContent value="audit" className="space-y-4 mt-0">
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Auditable Leave Transactions & Ledger History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Reason / Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                        No ledger transaction logs recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerLogs.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(l.createdAt), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-semibold text-xs">
                          {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "N/A"}
                          <span className="text-[10px] text-muted-foreground block font-mono">{l.employee?.employeeId}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">
                            {l.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{l.leaveType}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.reason || l.reference || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: APPROVE / REJECT LEAVE */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {approvalTarget?.action === "APPROVED" ? "Approve Leave Request" : "Reject Leave Request"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {approvalError && (
              <div className="p-3 rounded-lg bg-destructive/15 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{approvalError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="appr-comments">
                {approvalTarget?.action === "REJECTED" ? "Rejection Reason (Required) *" : "Approval Comment (Optional)"}
              </Label>
              <Textarea
                id="appr-comments"
                placeholder={approvalTarget?.action === "REJECTED" ? "State reason for rejection..." : "Add optional approval notes..."}
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                required={approvalTarget?.action === "REJECTED"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)} disabled={approvalMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant={approvalTarget?.action === "REJECTED" ? "destructive" : "default"}
              onClick={() => {
                if (approvalTarget) {
                  approvalMutation.mutate({
                    id: approvalTarget.id,
                    status: approvalTarget.action,
                    comments: approvalComment,
                  });
                }
              }}
              disabled={approvalMutation.isPending}
            >
              {approvalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {approvalTarget?.action === "APPROVED" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: MANAGE EMPLOYEE BALANCE */}
      {selectedBalanceEmp && (
        <Dialog open={isManageBalanceOpen} onOpenChange={setIsManageBalanceOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Manage Employee Leave Balance
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {selectedBalanceEmp.name} ({selectedBalanceEmp.employeeId}) • {selectedBalanceEmp.department}
              </p>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!balanceReason.trim()) {
                  setBalanceError("Reason for balance adjustment is required.");
                  return;
                }
                balanceMutation.mutate({
                  employeeId: selectedBalanceEmp.id,
                  payload: {
                    annual: annualBal,
                    casual: casualBal,
                    medical: medicalBal,
                    earned: earnedBal,
                    compOff: compOffBal,
                    reason: balanceReason,
                  },
                });
              }}
              className="space-y-4 py-2"
            >
              {balanceError && (
                <div className="p-3 rounded-lg bg-destructive/15 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{balanceError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Annual Leave Allocation</Label>
                  <Input type="number" value={annualBal} onChange={(e) => setAnnualBal(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Casual Leave Allocation</Label>
                  <Input type="number" value={casualBal} onChange={(e) => setCasualBal(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Medical Leave Allocation</Label>
                  <Input type="number" value={medicalBal} onChange={(e) => setMedicalBal(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Earned Leave Allocation</Label>
                  <Input type="number" value={earnedBal} onChange={(e) => setEarnedBal(Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Comp Off Allocation</Label>
                <Input type="number" value={compOffBal} onChange={(e) => setCompOffBal(Number(e.target.value))} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Adjustment Reason (Audited) *</Label>
                <Input
                  placeholder="e.g. Approved carry-forward adjustment"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsManageBalanceOpen(false)} disabled={balanceMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={balanceMutation.isPending}>
                  {balanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: ADD LEAVE TYPE */}
      <Dialog open={isAddLeaveTypeOpen} onOpenChange={setIsAddLeaveTypeOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Create Master Leave Type
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createLeaveTypeMutation.mutate({
                name: leaveTypeName,
                code: leaveTypeCode,
                description: leaveTypeDesc,
                category: leaveTypeCategory,
                defaultAllocation: leaveTypeDefaultAlloc,
                accrualType: leaveTypeAccrual,
                carryForwardEnabled: leaveTypeCarryForward,
                maxCarryForward: leaveTypeMaxCarry,
                encashmentEnabled: leaveTypeEncashable,
              });
            }}
            className="space-y-4 py-2"
          >
            {leaveTypeError && (
              <div className="p-3 rounded-lg bg-destructive/15 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{leaveTypeError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Leave Name *</Label>
                <Input placeholder="e.g. Paternity Leave" value={leaveTypeName} onChange={(e) => setLeaveTypeName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Code *</Label>
                <Input placeholder="e.g. PAT" value={leaveTypeCode} onChange={(e) => setLeaveTypeCode(e.target.value.toUpperCase())} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <select
                  className="w-full h-9 px-3 border rounded-lg text-xs bg-background"
                  value={leaveTypeCategory}
                  onChange={(e) => setLeaveTypeCategory(e.target.value)}
                >
                  <option value="PAID">Paid Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Default Annual Allocation</Label>
                <Input type="number" value={leaveTypeDefaultAlloc} onChange={(e) => setLeaveTypeDefaultAlloc(Number(e.target.value))} required />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Leave policy description..." rows={2} value={leaveTypeDesc} onChange={(e) => setLeaveTypeDesc(e.target.value)} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddLeaveTypeOpen(false)} disabled={createLeaveTypeMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLeaveTypeMutation.isPending}>
                {createLeaveTypeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Leave Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD HOLIDAY */}
      <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              Add Company Holiday
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createHolidayMutation.mutate({
                name: holidayName,
                date: holidayDate,
                type: holidayType,
                description: holidayDesc,
              });
            }}
            className="space-y-4 py-2"
          >
            {holidayError && (
              <div className="p-3 rounded-lg bg-destructive/15 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{holidayError}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Holiday Name *</Label>
              <Input placeholder="e.g. Independence Day" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Holiday Date *</Label>
                <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <select
                  className="w-full h-9 px-3 border rounded-lg text-xs bg-background"
                  value={holidayType}
                  onChange={(e) => setHolidayType(e.target.value)}
                >
                  <option value="NATIONAL">National Holiday</option>
                  <option value="REGIONAL">Regional Holiday</option>
                  <option value="COMPANY">Company Event</option>
                  <option value="OPTIONAL">Optional / Restricted</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Holiday notes..." rows={2} value={holidayDesc} onChange={(e) => setHolidayDesc(e.target.value)} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddHolidayOpen(false)} disabled={createHolidayMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createHolidayMutation.isPending}>
                {createHolidayMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Holiday
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
