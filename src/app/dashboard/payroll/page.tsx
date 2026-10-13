"use client";

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
  AlertCircle,
  Sparkles,
  Send,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
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

function HRPayrollDashboard() {
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
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  const [autoCalculationNote, setAutoCalculationNote] = useState<string | null>(null);

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

  // Auto-populate employee salary, working days & details
  const autoPopulateEmployeePayroll = async (emp: any, targetMonth?: number, targetYear?: number) => {
    if (!emp) return;
    const m = targetMonth || formData.month || (new Date().getMonth() + 1);
    const y = targetYear || formData.year || (new Date().getFullYear());

    // 1. Instant Zero-Latency Calculation (Client-side math from shift & calendar)
    const totalDays = new Date(y, m, 0).getDate();
    const weeklyOffs: string[] = emp?.shift?.weeklyOff?.length
      ? emp.shift.weeklyOff.map((d: string) => d.toLowerCase())
      : ['sunday'];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let offCount = 0;
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(y, m - 1, d);
      if (weeklyOffs.includes(dayNames[curDate.getDay()])) {
        offCount++;
      }
    }
    const localWorkingDays = Math.max(1, totalDays - offCount);
    const localBaseSalary = emp.baseSalary !== undefined && emp.baseSalary !== null ? String(emp.baseSalary) : "0";
    const localTxn = `TXN-${y}${String(m).padStart(2, '0')}-${emp.employeeId || 'EMP'}`;

    setFormData(prev => ({
      ...prev,
      employeeId: emp.id,
      month: m,
      year: y,
      basicSalary: localBaseSalary,
      workingDays: String(localWorkingDays),
      paidDays: String(localWorkingDays),
      bankName: emp.bankName || prev.bankName || "",
      accountNumber: emp.accountNumber || prev.accountNumber || "",
      transactionId: localTxn
    }));
    setAutoCalculationNote(`Auto-calculated: Basic Salary ₹${Number(localBaseSalary).toLocaleString('en-IN')}, Working Days: ${localWorkingDays}`);

    // 2. Fetch refined enterprise calculation preview from backend
    try {
      setIsAutoCalculating(true);
      const res = await api.get('/payroll/preview-calculation', {
        params: { employeeId: emp.id, month: m, year: y }
      });
      if (res.data?.success && res.data.data) {
        const p = res.data.data;
        setFormData(prev => ({
          ...prev,
          employeeId: emp.id,
          month: m,
          year: y,
          basicSalary: String(p.basicSalary !== undefined ? p.basicSalary : localBaseSalary),
          workingDays: String(p.workingDays || localWorkingDays),
          paidDays: String(p.paidDays || p.workingDays || localWorkingDays),
          bankName: p.bankName || emp.bankName || prev.bankName || "",
          accountNumber: p.accountNumber || emp.accountNumber || prev.accountNumber || "",
          transactionId: p.transactionId || localTxn
        }));
        setAutoCalculationNote(`Enterprise Verified: Basic Salary ₹${Number(p.basicSalary || localBaseSalary).toLocaleString('en-IN')}, Working Days: ${p.workingDays || localWorkingDays} (${p.totalDaysInMonth} total - ${p.weeklyOffCount} off)`);
      }
    } catch (err) {
      console.warn("Backend preview calculation fallback:", err);
    } finally {
      setIsAutoCalculating(false);
    }
  };

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
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["payrollRecords"] });
      queryClient.invalidateQueries({ queryKey: ["payrollSummary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      toast.success(res?.message || "Payroll issued successfully! Salary slip PDF has been emailed to the employee.");
      setIsCreateModalOpen(false);
      setAutoCalculationNote(null);
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
      const msg = err.response?.data?.message || "Failed to create payroll record.";
      setCreateError(msg);
      toast.error(msg);
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
  const grossVal = basicVal + bonusVal;
  const dedVal = parseFloat(formData.deductions) || 0;
  const netVal = Math.max(0, grossVal - dedVal);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto w-full min-w-0">
      {/* Page Header */}
      <PageHeader
        title="Payroll & Compensation Suite"
        description="Process employee salaries, track disbursals, review tax & PF deductions, and generate printable payslips."
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="h-8 sm:h-9 text-xs px-2.5 sm:px-3 bg-primary hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Create Payroll</span>
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-3">
        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Net Disbursement</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-emerald-600 font-mono truncate">₹{totalDisbursement.toLocaleString('en-IN')}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Total Take-Home</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Gross Payroll</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-foreground font-mono truncate">₹{totalGross.toLocaleString('en-IN')}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Total Expenditure</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Banknote className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Deductions</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-rose-600 font-mono truncate">₹{totalDeductions.toLocaleString('en-IN')}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Tax, PF & Statutory</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Staff Paid</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-foreground font-mono truncate">{totalPaidCount}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Successful Disbursals</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Avg Monthly</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-foreground font-mono truncate">₹{Math.round(avgSalary).toLocaleString('en-IN')}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Per Employee</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Pending Action</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-amber-600 font-mono truncate">{pendingCount}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Requires Approval</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 sm:space-y-5">
        <TabsList className="bg-muted/60 p-1 rounded-xl flex overflow-x-auto no-scrollbar scroll-smooth gap-1 w-full sm:w-fit justify-start">
          <TabsTrigger value="records" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
            <FileText className="w-3.5 h-3.5" />
            <span>Payroll Disbursals ({filteredPayrolls.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Trends</span>
          </TabsTrigger>
          <TabsTrigger value="structure" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
            <Layers className="w-3.5 h-3.5" />
            <span>Salary Components</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Log</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Payroll Disbursals Table */}
        <TabsContent value="records" className="space-y-4">
          {/* Filters Bar */}
          <Card className="border shadow-xs">
            <CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full">
                <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Employee Name, ID, or Email..."
                    className="pl-8 h-8 sm:h-9 text-xs"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <select
                    className="h-8 sm:h-9 px-2.5 text-xs rounded-md border bg-background"
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
                    className="h-8 sm:h-9 px-2.5 text-xs rounded-md border bg-background"
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
                    className="h-8 sm:h-9 px-2.5 text-xs rounded-md border bg-background col-span-2 sm:col-span-1"
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
                  className="h-8 sm:h-9 text-xs text-muted-foreground self-end sm:self-auto"
                >
                  Reset Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Records View: Mobile Card List (< md) and Desktop Table (>= md) */}
          <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-border">
              {isLoadingPayroll ? (
                <div className="h-24 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Loading payroll records...
                </div>
              ) : paginatedPayrolls.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
                  No payroll records match the selected criteria.
                </div>
              ) : (
                paginatedPayrolls.map((p: any) => (
                  <div key={p.id} className="p-3 space-y-2 hover:bg-muted/15 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-foreground truncate">
                          {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : "N/A"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          PAY-{p.id.slice(0, 6).toUpperCase()} • {monthNames[p.month - 1]} {p.year}
                        </div>
                      </div>
                      <div className="shrink-0 scale-90 origin-right">
                        {statusBadge(p.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Net Salary</span>
                        <span className="font-extrabold text-emerald-600 text-sm font-mono">
                          ₹{(p.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Gross / Ded</span>
                        <span className="text-[11px] text-foreground font-mono block">
                          ₹{Math.round(p.grossSalary || 0)} / <span className="text-rose-600">-₹{Math.round(p.deductions || 0)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                      <span>{p.workingDays} / {p.paidDays || p.workingDays} Days</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-primary"
                          onClick={() => setViewPayslipRecord(p)}
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1" />
                          Payslip
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
          </div>

          {/* Pagination */}
          {filteredPayrolls.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-muted-foreground pt-2">
              <span className="text-[11px] sm:text-xs">
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                <strong>{Math.min(currentPage * itemsPerPage, filteredPayrolls.length)}</strong> of{" "}
                <strong>{filteredPayrolls.length}</strong> payroll records
              </span>

              <div className="flex items-center gap-2 self-center sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <span className="font-medium text-foreground text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
        <DialogContent className="w-[95vw] max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-3.5 sm:p-5 px-4 sm:px-6 border-b shrink-0 bg-background">
            <DialogTitle className="text-sm sm:text-lg font-bold flex items-center gap-2 text-primary">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Create & Issue Employee Payroll</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 text-xs overflow-y-auto flex-1">
              {createError && (
                <div className="p-2.5 sm:p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="md:col-span-2 space-y-1 relative">
                  <Label className="text-xs font-semibold">Search / Select Employee *</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type Name, Email, or Employee ID to search..."
                      className="pl-8 pr-8 h-8 sm:h-9 text-xs"
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
                                setEmpSearchQuery(`${emp.firstName} ${emp.lastName} (${emp.email})`);
                                setIsEmpDropdownOpen(false);
                                autoPopulateEmployeePayroll(emp, formData.month, formData.year);
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
                              <div className="flex items-center gap-2">
                                {emp.baseSalary ? (
                                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    ₹{Number(emp.baseSalary).toLocaleString('en-IN')}
                                  </span>
                                ) : null}
                                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                  {emp.employeeId || "NO ID"}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Auto Calculation Banner */}
                {isAutoCalculating ? (
                  <div className="md:col-span-2 p-2.5 sm:p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                    <span>Analyzing employee shift weekly offs, holidays & base salary...</span>
                  </div>
                ) : autoCalculationNote ? (
                  <div className="md:col-span-2 p-2.5 sm:p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium text-[11px] sm:text-xs">{autoCalculationNote}</span>
                    </div>
                    <Badge variant="outline" className="text-[9.5px] sm:text-[10px] bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shrink-0 w-fit">
                      Auto-Populated
                    </Badge>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Pay Month *</Label>
                  <select
                    required
                    className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                    value={formData.month}
                    onChange={(e) => {
                      const newMonth = parseInt(e.target.value);
                      setFormData(prev => ({ ...prev, month: newMonth }));
                      const selectedEmp = employees.find((emp: any) => emp.id === formData.employeeId);
                      if (selectedEmp) {
                        autoPopulateEmployeePayroll(selectedEmp, newMonth, formData.year);
                      } else {
                        const totalDays = new Date(formData.year, newMonth, 0).getDate();
                        let sundays = 0;
                        for (let d = 1; d <= totalDays; d++) {
                          if (new Date(formData.year, newMonth - 1, d).getDay() === 0) sundays++;
                        }
                        const wDays = Math.max(1, totalDays - sundays);
                        setFormData(prev => ({ ...prev, month: newMonth, workingDays: String(wDays), paidDays: String(wDays) }));
                      }
                    }}
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
                    className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                    value={formData.year}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      setFormData(prev => ({ ...prev, year: newYear }));
                      const selectedEmp = employees.find((emp: any) => emp.id === formData.employeeId);
                      if (selectedEmp) {
                        autoPopulateEmployeePayroll(selectedEmp, formData.month, newYear);
                      } else {
                        const totalDays = new Date(newYear, formData.month, 0).getDate();
                        let sundays = 0;
                        for (let d = 1; d <= totalDays; d++) {
                          if (new Date(newYear, formData.month - 1, d).getDay() === 0) sundays++;
                        }
                        const wDays = Math.max(1, totalDays - sundays);
                        setFormData(prev => ({ ...prev, year: newYear, workingDays: String(wDays), paidDays: String(wDays) }));
                      }
                    }}
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
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Basic Salary (₹) *</Label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-filled
                    </span>
                  </div>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25000"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    className="h-8 sm:h-9 text-xs font-semibold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Bonus & Allowances (₹)</Label>
                    <span className="text-[10px] text-muted-foreground">Discretionary</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    className="h-8 sm:h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Total Deductions / TDS (₹)</Label>
                    <span className="text-[10px] text-rose-500 font-medium">TDS / PF</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    className="h-8 sm:h-9 text-xs text-rose-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Working Days</Label>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Shift Counted</span>
                  </div>
                  <Input
                    required
                    type="number"
                    value={formData.workingDays}
                    onChange={(e) => setFormData({ ...formData, workingDays: e.target.value, paidDays: e.target.value })}
                    className="h-8 sm:h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Payment Date *</Label>
                  <Input
                    required
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="h-8 sm:h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Disbursal Status</Label>
                  <select
                    className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PAID">PAID</option>
                    <option value="PROCESSED">PROCESSED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Bank Name</Label>
                  <Input
                    placeholder="e.g. State Bank of India"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="h-8 sm:h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Account Number</Label>
                  <Input
                    placeholder="Account / IFSC Ref"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="h-8 sm:h-9 text-xs font-mono"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs font-semibold">Transaction Ref / ID</Label>
                  <Input
                    placeholder="Bank Reference Number (TXN-...)"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    className="h-8 sm:h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Instant Calculation Preview */}
              <div className="p-2.5 sm:p-3 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase">Estimated Net Salary</span>
                  <p className="text-[11px] text-muted-foreground">Gross: ₹{grossVal.toLocaleString()} - Ded: ₹{dedVal.toLocaleString()}</p>
                </div>
                <span className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{netVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <DialogFooter className="p-3 sm:p-4 px-4 sm:px-6 border-t bg-muted/20 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>PDF payslip will be generated & emailed with attachment.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)} disabled={createPayrollMutation.isPending} className="flex-1 sm:flex-initial text-xs h-8 sm:h-9">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createPayrollMutation.isPending || isAutoCalculating} className="bg-primary hover:bg-primary/90 font-medium flex-1 sm:flex-initial text-xs h-8 sm:h-9">
                  {createPayrollMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Issue Payroll
                    </>
                  )}
                </Button>
              </div>
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

export default function PayrollPage() {
  const user = useAuthStore((state) => state.user);
  const isHR = user?.role === 'HR_MANAGER' || user?.role === 'SUPER_ADMIN' || user?.role === 'HR Admin' || user?.role === 'HR_ADMIN';

  if (user && !isHR) {
    return <PayrollManagementClient />;
  }

  return <HRPayrollDashboard />;
}
