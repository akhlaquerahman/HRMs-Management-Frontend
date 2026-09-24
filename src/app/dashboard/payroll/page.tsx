import { Metadata } from 'next';
import { PayrollManagementClient } from '../payslips/components/PayrollManagementClient';

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useTranslation } from "react-i18next";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wallet,
  Banknote,
  CheckCircle2,
  TrendingDown,
  Plus,
  Trash2,
  Receipt,
  Download,
  RefreshCw,
  Search,
  Building2,
  UserCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  ShieldCheck,
  MoreVertical,
  BarChart3,
  Layers,
  Check,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { PayslipPdfViewer } from "../payslips/components/PayslipPdfViewer";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from "recharts";

export default function PayrollPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("records");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewPayslipRecord, setViewPayslipRecord] = useState<any>(null);
  const [createError, setCreateError] = useState("");

  // Create Form State
  const [formData, setFormData] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: "",
    bonus: "0",
    deductions: "0",
    workingDays: "30",
    paidDays: "30",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionId: "",
    status: "PAID",
    bankName: "",
    accountNumber: ""
  });

  // Employee Combobox Search State
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);

  // Queries
  const { data: payrollRes, isLoading: isLoadingPayroll, refetch: refetchPayroll } = useQuery({
    queryKey: ["payrollRecords", searchTerm, statusFilter, monthFilter, yearFilter],
    queryFn: async () => (await api.get("/payroll")).data,
  });

  const { data: employeesRes } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get("/employees")).data,
  });

  const { data: companyRes } = useQuery({
    queryKey: ["company"],
    queryFn: async () => (await api.get("/company")).data,
  });

  const payrolls = payrollRes?.data || [];
  const employees = employeesRes?.data || [];
  const companyData = companyRes?.data;

  // Pre-indexed search keys for 60fps instant typing performance
  const indexedEmployees = useMemo(() => {
    return employees.map((emp: any) => ({
      ...emp,
      _searchKey: `${emp.firstName || ""} ${emp.lastName || ""} ${emp.email || ""} ${emp.employeeId || ""}`.toLowerCase()
    }));
  }, [employees]);

  // Instant real-time filtering on every single letter typed
  const filteredEmployeesForSelect = useMemo(() => {
    const q = empSearchQuery.trim().toLowerCase();
    if (!q) return indexedEmployees.slice(0, 20);

    const matches: any[] = [];
    for (let i = 0; i < indexedEmployees.length; i++) {
      if (indexedEmployees[i]._searchKey.includes(q)) {
        matches.push(indexedEmployees[i]);
        if (matches.length >= 20) break; // Early termination for zero UI latency
      }
    }
    return matches;
  }, [indexedEmployees, empSearchQuery]);

  // Filter Logic
  const filteredPayrolls = payrolls.filter((p: any) => {
    const empName = p.employee ? `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase() : "";
    const empEmail = (p.employee?.email || "").toLowerCase();
    const empId = (p.employee?.employeeId || "").toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch = !q || empName.includes(q) || empEmail.includes(q) || empId.includes(q);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesMonth = monthFilter === "ALL" || p.month === parseInt(monthFilter);
    const matchesYear = yearFilter === "ALL" || p.year === parseInt(yearFilter);

    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage) || 1;
  const paginatedPayrolls = filteredPayrolls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Mutations
  const createPayrollMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/payroll", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrollRecords"] });
      setIsCreateModalOpen(false);
      setFormData({
        employeeId: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basicSalary: "",
        bonus: "0",
        deductions: "0",
        workingDays: "30",
        paidDays: "30",
        paymentDate: new Date().toISOString().split("T")[0],
        transactionId: "",
        status: "PAID",
        bankName: "",
        accountNumber: ""
      });
      setCreateError("");
      setEmpSearchQuery("");
      setIsEmpDropdownOpen(false);
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || "Failed to create payroll record.");
    }
  });

  const deletePayrollMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/payroll/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrollRecords"] });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      setCreateError("Please select an employee.");
      return;
    }
    if (!formData.basicSalary || parseFloat(formData.basicSalary) <= 0) {
      setCreateError("Please enter a valid basic salary.");
      return;
    }
    createPayrollMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this payroll record?")) {
      deletePayrollMutation.mutate(id);
    }
  };

  const handleExportCSV = () => {
    if (filteredPayrolls.length === 0) return;
    const dataToExport = filteredPayrolls.map((p: any) => ({
      "Payroll ID": `PAY-${p.id.slice(0, 8).toUpperCase()}`,
      Employee: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : "N/A",
      "Employee ID": p.employee?.employeeId || "N/A",
      Department: p.employee?.department?.name || "N/A",
      Period: `${p.month}/${p.year}`,
      "Working Days": p.workingDays,
      "Paid Days": p.paidDays || p.workingDays,
      "Gross Salary (INR)": p.grossSalary || 0,
      "Deductions (INR)": p.deductions || 0,
      "Net Salary (INR)": p.netSalary || 0,
      Status: p.status,
      "Payment Date": format(new Date(p.paymentDate), "yyyy-MM-dd"),
      "Transaction ID": p.transactionId || "N/A",
      "Bank Name": p.employee?.bankName || p.bankName || "N/A",
      "Account No": p.employee?.accountNumber || p.accountNumber || "N/A"
    }));

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
    link.setAttribute("download", `HRMS_Payroll_Report_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregated KPI Stats
  const totalDisbursement = payrolls.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
  const totalGross = payrolls.reduce((sum: number, p: any) => sum + (p.grossSalary || 0), 0);
  const totalDeductions = payrolls.reduce((sum: number, p: any) => sum + (p.deductions || 0), 0);
  const totalPaidCount = payrolls.filter((p: any) => p.status === "PAID").length;
  const avgSalary = payrolls.length > 0 ? totalDisbursement / payrolls.length : 0;
  const pendingCount = payrolls.filter((p: any) => p.status === "PENDING").length;

  // Chart Data Preparation
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = monthNames.map((m, idx) => {
    const monthPayrolls = payrolls.filter((p: any) => p.month === idx + 1);
    const net = monthPayrolls.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
    const gross = monthPayrolls.reduce((sum: number, p: any) => sum + (p.grossSalary || 0), 0);
    const ded = monthPayrolls.reduce((sum: number, p: any) => sum + (p.deductions || 0), 0);
    return { name: m, NetSalary: net, GrossSalary: gross, Deductions: ded };
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">PAID</Badge>;
      case "PROCESSED":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800">PROCESSED</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800">PENDING</Badge>;
      case "FAILED":
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800">FAILED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Computed Form Preview Values
  const basicVal = parseFloat(formData.basicSalary) || 0;
  const bonusVal = parseFloat(formData.bonus) || 0;
  const hraVal = basicVal * 0.4;
  const grossVal = basicVal + hraVal + bonusVal;
  const dedVal = parseFloat(formData.deductions) || 0;
  const netVal = Math.max(0, grossVal - dedVal);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6">
      {/* Page Header */}
      <PageHeader
        title="Payroll & Compensation Suite"
        description="Process employee salaries, track disbursals, review tax & PF deductions, and generate printable payslips."
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="h-9 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Payroll
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Disbursement</p>
              <h3 className="text-xl font-bold mt-1 text-emerald-600">₹{totalDisbursement.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total Take-Home</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Payroll</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">₹{totalGross.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total Expenditure</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Deductions</p>
              <h3 className="text-xl font-bold mt-1 text-rose-600">₹{totalDeductions.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Tax, PF & Statutory</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff Paid</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">{totalPaidCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Successful Disbursals</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Monthly</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">₹{Math.round(avgSalary).toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Per Employee</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Action</p>
              <h3 className="text-xl font-bold mt-1 text-amber-600">{pendingCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Requires Approval</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-5">
        <TabsList className="bg-muted/60 p-1 rounded-xl flex flex-wrap gap-1 w-fit">
          <TabsTrigger value="records" className="rounded-lg px-4 py-2 text-xs font-semibold gap-2">
            <FileText className="w-4 h-4" />
            Payroll Disbursals ({filteredPayrolls.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-4 py-2 text-xs font-semibold gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics & Trends
          </TabsTrigger>
          <TabsTrigger value="structure" className="rounded-lg px-4 py-2 text-xs font-semibold gap-2">
            <Layers className="w-4 h-4" />
            Salary Components & Tax Rules
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg px-4 py-2 text-xs font-semibold gap-2">
            <ShieldCheck className="w-4 h-4" />
            Disbursal Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Payroll Disbursals Table */}
        <TabsContent value="records" className="space-y-4">
          {/* Filters Bar */}
          <Card className="border shadow-xs">
            <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Employee Name, ID, or Email..."
                    className="pl-8 h-9 text-xs"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <select
                  className="h-9 px-3 text-xs rounded-md border bg-background"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">PAID</option>
                  <option value="PROCESSED">PROCESSED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>

                <select
                  className="h-9 px-3 text-xs rounded-md border bg-background"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Months</option>
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  className="h-9 px-3 text-xs rounded-md border bg-background"
                  value={yearFilter}
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              {(searchTerm || statusFilter !== "ALL" || monthFilter !== "ALL" || yearFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                    setMonthFilter("ALL");
                    setYearFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Reset Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
            <Table className="text-xs">
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="font-semibold">Payroll Ref</TableHead>
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Department & Title</TableHead>
                  <TableHead className="font-semibold">Period</TableHead>
                  <TableHead className="font-semibold">Working / Paid Days</TableHead>
                  <TableHead className="font-semibold">Gross Salary</TableHead>
                  <TableHead className="font-semibold text-rose-600">Deductions</TableHead>
                  <TableHead className="font-semibold text-emerald-600">Net Salary</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPayroll ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Loading payroll records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedPayrolls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      No payroll records match the selected criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayrolls.map((p: any) => (
                    <TableRow key={p.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-muted-foreground text-[11px]">
                        PAY-{p.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-foreground">
                          {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : "N/A"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{p.employee?.email || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">{p.employee?.department?.name || "General"}</span>
                          <span className="text-[11px] text-muted-foreground">{p.employee?.designation?.name || "Staff"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {monthNames[p.month - 1]} {p.year}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.workingDays} / {p.paidDays || p.workingDays} Days
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{(p.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-rose-600 font-medium">
                        -₹{(p.deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600 text-sm">
                        ₹{(p.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setViewPayslipRecord(p)}
                          >
                            <Receipt className="w-3.5 h-3.5 text-primary" />
                            Payslip
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewPayslipRecord(p)}>
                                <Eye className="w-4 h-4 mr-2" /> View Printable Payslip
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-rose-600 focus:text-rose-600"
                                onClick={() => handleDelete(p.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredPayrolls.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                <strong>{Math.min(currentPage * itemsPerPage, filteredPayrolls.length)}</strong> of{" "}
                <strong>{filteredPayrolls.length}</strong> payroll records
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="font-medium text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Analytics & Trends */}
        <TabsContent value="analytics" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Monthly Disbursement Trend (₹)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Legend />
                    <Line type="monotone" dataKey="NetSalary" stroke="#10b981" strokeWidth={3} name="Net Salary (Disbursed)" />
                    <Line type="monotone" dataKey="GrossSalary" stroke="#3b82f6" strokeWidth={2} name="Gross Salary" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  Gross vs Deductions Breakdown (₹)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="GrossSalary" fill="#3b82f6" name="Gross Salary" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Deductions" fill="#f43f5e" name="Tax & Deductions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Salary Components & Statutory Tax */}
        <TabsContent value="structure" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="border shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                  <Layers className="w-5 h-5" />
                  Standard Salary Earnings Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Basic Salary</span>
                    <p className="text-muted-foreground text-[11px]">Core component (50% of Total CTC)</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">50% Fixed</Badge>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">House Rent Allowance (HRA)</span>
                    <p className="text-muted-foreground text-[11px]">Tax exempted accommodation component</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">40% Basic</Badge>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Special & Performance Allowance</span>
                    <p className="text-muted-foreground text-[11px]">Flexible performance-linked pay</p>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">Variable</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                  <ShieldCheck className="w-5 h-5" />
                  Statutory Deductions & Compliance (India FY 2026-27)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Provident Fund (EPF)</span>
                    <p className="text-muted-foreground text-[11px]">12% of (Basic + DA) capped at statutory limits</p>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">12% Basic</Badge>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Employees State Insurance (ESIC)</span>
                    <p className="text-muted-foreground text-[11px]">0.75% for Gross Salary ≤ ₹21,000/month</p>
                  </div>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700">0.75% Gross</Badge>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Income Tax / TDS</span>
                    <p className="text-muted-foreground text-[11px]">Computed according to New Tax Regime slabs</p>
                  </div>
                  <Badge variant="outline" className="bg-rose-50 text-rose-700">Auto Slabs</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Audit & Activity Log */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Payroll Activity & Processing Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="border-l-2 border-emerald-500 pl-4 py-1 space-y-1">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Batch Payroll Disbursal Completed</span>
                  <span className="text-muted-foreground font-normal text-[11px]">Today at 10:15 AM</span>
                </div>
                <p className="text-muted-foreground">Salary credited for 2,022 employees for the current period via HDFC Direct API Bank Transfer.</p>
              </div>

              <div className="border-l-2 border-blue-500 pl-4 py-1 space-y-1">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Payslips Auto-Generated & Emailed</span>
                  <span className="text-muted-foreground font-normal text-[11px]">Yesterday at 06:30 PM</span>
                </div>
                <p className="text-muted-foreground">Digital PDF payslips published to self-service employee portals.</p>
              </div>

              <div className="border-l-2 border-purple-500 pl-4 py-1 space-y-1">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Tax & PF Statutory Returns Uploaded</span>
                  <span className="text-muted-foreground font-normal text-[11px]">23 Sep 2026</span>
                </div>
                <p className="text-muted-foreground">Form 24Q TDS filing verified for Q2 FY 2026-27.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Master Payroll Dialog Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 px-6 border-b shrink-0 bg-background">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
              <Plus className="w-5 h-5" />
              Create & Issue Employee Payroll
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {createError && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1 relative">
                  <Label className="text-xs font-semibold">Search / Select Employee *</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type Name, Email, or Employee ID to search..."
                      className="pl-8 pr-8 h-9 text-xs"
                      value={empSearchQuery}
                      onFocus={() => setIsEmpDropdownOpen(true)}
                      onChange={(e) => {
                        setEmpSearchQuery(e.target.value);
                        setIsEmpDropdownOpen(true);
                        if (formData.employeeId) {
                          setFormData({ ...formData, employeeId: "" });
                        }
                      }}
                    />
                    {empSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmpSearchQuery("");
                          setFormData({ ...formData, employeeId: "", bankName: "", accountNumber: "" });
                          setIsEmpDropdownOpen(true);
                        }}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Searchable Dropdown List */}
                  {isEmpDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover text-popover-foreground border rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y text-xs">
                      {filteredEmployeesForSelect.length === 0 ? (
                        <div className="p-3 text-center text-muted-foreground">
                          No matching employees found for "{empSearchQuery}"
                        </div>
                      ) : (
                        filteredEmployeesForSelect.map((emp: any) => {
                          const isSelected = formData.employeeId === emp.id;
                          return (
                            <div
                              key={emp.id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  employeeId: emp.id,
                                  bankName: emp.bankName || formData.bankName || "",
                                  accountNumber: emp.accountNumber || formData.accountNumber || ""
                                });
                                setEmpSearchQuery(`${emp.firstName} ${emp.lastName} (${emp.email})`);
                                setIsEmpDropdownOpen(false);
                              }}
                              className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors ${
                                isSelected ? "bg-primary/10 font-bold text-primary" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </div>
                                <div>
                                  <div className="font-semibold text-foreground">
                                    {emp.firstName} {emp.lastName}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {emp.email} • {emp.department?.name || "General"}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                {emp.employeeId || "NO ID"}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Pay Month *</Label>
                  <select
                    required
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  >
                    <option value={1}>January (01)</option>
                    <option value={2}>February (02)</option>
                    <option value={3}>March (03)</option>
                    <option value={4}>April (04)</option>
                    <option value={5}>May (05)</option>
                    <option value={6}>June (06)</option>
                    <option value={7}>July (07)</option>
                    <option value={8}>August (08)</option>
                    <option value={9}>September (09)</option>
                    <option value={10}>October (10)</option>
                    <option value={11}>November (11)</option>
                    <option value={12}>December (12)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Pay Year *</Label>
                  <select
                    required
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  >
                    <option value={2027}>2027</option>
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                    <option value={2022}>2022</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Basic Salary (₹) *</Label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25000"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    className="h-9 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Bonus & Allowances (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Total Deductions / TDS (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    className="h-9 text-xs text-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Working Days</Label>
                  <Input
                    required
                    type="number"
                    value={formData.workingDays}
                    onChange={(e) => setFormData({ ...formData, workingDays: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Payment Date *</Label>
                  <Input
                    required
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Disbursal Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PAID">PAID</option>
                    <option value="PROCESSED">PROCESSED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Bank Name</Label>
                  <Input
                    placeholder="e.g. State Bank of India"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Account Number</Label>
                  <Input
                    placeholder="Account / IFSC Ref"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Transaction Ref / ID</Label>
                  <Input
                    placeholder="Bank Reference Number (TXN-...)"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Instant Calculation Preview */}
              <div className="p-3 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Estimated Take-Home (Net Salary)</span>
                  <p className="text-xs text-muted-foreground">Gross: ₹{grossVal.toLocaleString()} - Ded: ₹{dedVal.toLocaleString()}</p>
                </div>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{netVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <DialogFooter className="p-4 px-6 border-t bg-muted/20 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={createPayrollMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPayrollMutation.isPending} className="bg-primary hover:bg-primary/90">
                {createPayrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Issue Payroll
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dark PDF Viewer Modal for Payslips */}
      <PayslipPdfViewer
        isOpen={!!viewPayslipRecord}
        onClose={() => setViewPayslipRecord(null)}
        record={viewPayslipRecord}
      />
    </div>
  );
}
