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
  Calendar,
  Clock,
  CheckCircle2,
  CalendarDays,
  Plus,
  Search,
  Eye,
  XCircle,
  Loader2,
  AlertCircle,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";

export function EmployeeLeaveRequestClient() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [workFromHome, setWorkFromHome] = useState(false);
  const [emergencyLeave, setEmergencyLeave] = useState(false);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  // Fetch summary
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["myLeaveSummary"],
    queryFn: async () => (await api.get("/leaves/summary")).data.data,
  });

  // Fetch leave types for dropdown
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ["leaveTypes"],
    queryFn: async () => (await api.get("/leaves/types")).data.data || [],
  });

  // Fetch my leave requests
  const { data: myLeaves = [], isLoading: isLeavesLoading } = useQuery({
    queryKey: ["myLeaves", statusFilter],
    queryFn: async () => (await api.get(`/leaves/my?status=${statusFilter}`)).data.data || [],
  });

  // Fetch upcoming holidays
  const { data: calendarData } = useQuery({
    queryKey: ["leaveCalendar"],
    queryFn: async () => (await api.get("/leaves/calendar")).data.data,
  });

  // Create Leave Request Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/leaves/my", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaveSummary"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaves"] });
      setIsRequestModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to submit leave request.");
    },
  });

  // Cancel Leave Request Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/leaves/${id}/status`, { status: "CANCELLED", comments: "Cancelled by employee" });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaveSummary"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaves"] });
      setIsViewModalOpen(false);
    },
  });

  const resetForm = () => {
    setLeaveType("ANNUAL");
    setStartDate("");
    setEndDate("");
    setHalfDay(false);
    setWorkFromHome(false);
    setEmergencyLeave(false);
    setDescription("");
    setFormError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setFormError("Please select both start date and end date.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError("End date cannot be earlier than start date.");
      return;
    }
    setFormError("");
    createMutation.mutate({
      leaveType,
      startDate,
      endDate,
      halfDay,
      workFromHome,
      emergencyLeave,
      description,
    });
  };

  // Filter requests by search term
  const filteredRequests = myLeaves.filter((r: any) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const typeMatch = (r.leaveType || "").toLowerCase().includes(q);
    const descMatch = (r.description || "").toLowerCase().includes(q);
    const idMatch = (r.id || "").toLowerCase().includes(q);
    return typeMatch || descMatch || idMatch;
  });

  const balances = summaryData?.balances || { annual: 18, casual: 8, medical: 10, earned: 5, compOff: 0 };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6">
      {/* Header */}
      <PageHeader
        title="My Leave Requests"
        description="Request leave, track your entitlement balances, and view scheduled company holidays."
        showCreate={false}
        showSearch={false}
        actionButton={
          <Button onClick={() => setIsRequestModalOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Quota
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isSummaryLoading ? "..." : summaryData?.metrics?.[0]?.value || 41} Days</div>
            <p className="text-xs text-muted-foreground mt-1">{summaryData?.metrics?.[0]?.trend || "Total Allocated"}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Requests
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isSummaryLoading ? "..." : summaryData?.metrics?.[1]?.value || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Under Manager / HR Review</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Approved Leaves
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isSummaryLoading ? "..." : summaryData?.metrics?.[2]?.value || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Processed This Year</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Leaves
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isSummaryLoading ? "..." : summaryData?.metrics?.[3]?.value || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled Next 30 Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Entitlements & Balances Cards */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              My Leave Entitlements & Balances
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configured company leave balance allocations and remaining days.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3.5 rounded-xl border bg-blue-50/50 border-blue-100 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-blue-700 tracking-wider truncate">Annual Leave</span>
                <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 font-mono text-[9px] sm:text-[10px] shrink-0">
                  Paid
                </Badge>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl font-extrabold text-blue-900">{balances.annual} Days</div>
                <span className="text-[10px] sm:text-xs text-blue-600 font-medium leading-tight block">Remaining</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl border bg-emerald-50/50 border-emerald-100 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-emerald-700 tracking-wider truncate">Casual Leave</span>
                <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200 font-mono text-[9px] sm:text-[10px] shrink-0">
                  Paid
                </Badge>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-900">{balances.casual} Days</div>
                <span className="text-[10px] sm:text-xs text-emerald-600 font-medium leading-tight block">Remaining</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl border bg-rose-50/50 border-rose-100 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-rose-700 tracking-wider truncate">Medical Leave</span>
                <Badge variant="outline" className="bg-white text-rose-700 border-rose-200 font-mono text-[9px] sm:text-[10px] shrink-0">
                  Paid
                </Badge>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl font-extrabold text-rose-900">{balances.medical} Days</div>
                <span className="text-[10px] sm:text-xs text-rose-600 font-medium leading-tight block">Remaining</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl border bg-purple-50/50 border-purple-100 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-purple-700 tracking-wider truncate">Earned Leave</span>
                <Badge variant="outline" className="bg-white text-purple-700 border-purple-200 font-mono text-[9px] sm:text-[10px] shrink-0">
                  Accrued
                </Badge>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl font-extrabold text-purple-900">{balances.earned} Days</div>
                <span className="text-[10px] sm:text-xs text-purple-600 font-medium leading-tight block">Remaining</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl border bg-amber-50/50 border-amber-100 flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-amber-700 tracking-wider truncate">Comp Off</span>
                <Badge variant="outline" className="bg-white text-amber-700 border-amber-200 font-mono text-[9px] sm:text-[10px] shrink-0">
                  Extra
                </Badge>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl font-extrabold text-amber-900">{balances.compOff} Days</div>
                <span className="text-[10px] sm:text-xs text-amber-600 font-medium leading-tight block">Remaining</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Toolbar & Requests Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <select
              className="h-9 px-3 py-1 border rounded-lg text-xs bg-background focus:ring-1 focus:ring-primary w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Request Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by leave type or description..."
              className="pl-9 h-9 text-xs rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border shadow-xs overflow-hidden">
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-28">Leave ID</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLeavesLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                      No leave requests found. Click &quot;Request Leave&quot; above to submit your first application.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((r: any) => {
                    const start = new Date(r.startDate);
                    const end = new Date(r.endDate);
                    const days = r.halfDay
                      ? 0.5
                      : Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                    return (
                      <TableRow key={r.id} className="hover:bg-muted/10">
                        <TableCell className="font-mono text-xs font-semibold">
                          LR-{r.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            {r.leaveType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{format(start, "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-xs">{format(end, "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-xs font-semibold">
                          {days} {days === 1 || days === 0.5 ? "Day" : "Days"} {r.halfDay && "(Half Day)"}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{r.description || "Personal leave"}</TableCell>
                        <TableCell>
                          {r.status === "APPROVED" && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                              Approved
                            </Badge>
                          )}
                          {r.status === "PENDING" && (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0 text-xs">
                              Pending Review
                            </Badge>
                          )}
                          {r.status === "REJECTED" && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
                          {r.status === "CANCELLED" && (
                            <Badge variant="secondary" className="text-xs">
                              Cancelled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(r.createdAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                setSelectedRequest(r);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                            {r.status === "PENDING" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() => cancelMutation.mutate(r.id)}
                                disabled={cancelMutation.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Holidays Widget */}
      {calendarData?.holidays && calendarData.holidays.length > 0 && (
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-600" />
              Upcoming Company Holidays
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {calendarData.holidays.map((h: any) => (
                <div key={h.id} className="p-3 border rounded-xl bg-gray-50/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold">{format(new Date(h.date), "dd")}</span>
                    <span className="text-[9px] uppercase font-semibold">{format(new Date(h.date), "MMM")}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-gray-900 truncate">{h.name}</h4>
                    <span className="text-[10px] text-muted-foreground">{h.type || "National"} Holiday</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Request Leave */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Calendar className="h-5 w-5 text-primary" />
              Apply for Leave
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/15 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="req-leave-type">Select Leave Type *</Label>
              <select
                id="req-leave-type"
                className="w-full h-10 px-3 py-2 border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                required
              >
                {leaveTypes.map((t: any) => (
                  <option key={t.id} value={t.code || t.name.toUpperCase().replace(/\s+/g, "_")}>
                    {t.name} ({t.category || "Paid"}) - Default {t.defaultAllocation} Days
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-desc">Reason / Notes for Manager</Label>
              <Textarea
                id="req-desc"
                placeholder="State the reason for your leave request..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={halfDay}
                  onChange={(e) => setHalfDay(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Half Day Request
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={emergencyLeave}
                  onChange={(e) => setEmergencyLeave(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Emergency Leave
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Leave Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: View Request Details */}
      {selectedRequest && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Leave Request Details</span>
                <Badge className="font-mono text-xs">LR-{selectedRequest.id.slice(0, 8).toUpperCase()}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-muted/30 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Leave Type:</span>
                  <span className="font-semibold text-primary">{selectedRequest.leaveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <span className="font-semibold">{selectedRequest.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Applied On:</span>
                  <span>{format(new Date(selectedRequest.createdAt), "dd MMM yyyy")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl">
                  <span className="text-xs text-muted-foreground block">From</span>
                  <span className="font-bold text-gray-900">{format(new Date(selectedRequest.startDate), "dd MMM yyyy")}</span>
                </div>
                <div className="p-3 border rounded-xl">
                  <span className="text-xs text-muted-foreground block">To</span>
                  <span className="font-bold text-gray-900">{format(new Date(selectedRequest.endDate), "dd MMM yyyy")}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Reason / Description</span>
                <p className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700">{selectedRequest.description || "No description provided."}</p>
              </div>

              {selectedRequest.approvalHistory && selectedRequest.approvalHistory.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase block">Approval Log History</span>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedRequest.approvalHistory.map((h: any) => (
                      <div key={h.id} className="p-2 border rounded-lg text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{h.action}</span>
                          <span className="text-muted-foreground block text-[10px]">
                            {h.actedBy ? `${h.actedBy.firstName} ${h.actedBy.lastName}` : "System"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(h.createdAt), "dd MMM, HH:mm")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
