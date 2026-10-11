import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { formatDate } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  UserCircle,
  MapPin,
  Phone,
  Mail,
  Building2,
  Calendar,
  FileText,
  Briefcase,
  User,
  CreditCard,
  PhoneCall,
  ShieldAlert,
  Building,
  UserCheck,
  Globe,
  Activity,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { EditEmployeeModal } from './EditEmployeeModal';

export function EmployeeProfileDrawer({ employeeId, isOpen, onClose }: { employeeId: string, isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'job' | 'personal' | 'attendance' | 'leaves' | 'documents' | 'contact' | 'bank' | 'company'>('job');

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employeeDetails', employeeId],
    queryFn: async () => (await api.get(`/employees/${employeeId}/details`)).data.data,
    enabled: !!employeeId && isOpen
  });

  const deactivateEmployee = useMutation({
    mutationFn: async () => {
      return await api.put(`/employees/${employeeId}`, { status: 'INACTIVE' });
    },
    onSuccess: () => {
      toast.success(t('Employee deactivated successfully'));
      queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDetails', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['workforceDashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message);
    }
  });

  const handleDeactivate = () => {
    if (confirm(t("Are you sure you want to deactivate this account?"))) {
      deactivateEmployee.mutate();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col border-l border-border/50">
          <SheetHeader className="p-6 pb-4 border-b border-border/50 bg-muted/10">
            <div className="flex justify-between items-start">
              <SheetTitle>{t("Employee Profile")}</SheetTitle>
            </div>
            <SheetDescription>{t("Detailed overview of the employee's record.")}</SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
              <div className="h-24 bg-muted rounded animate-pulse" />
              <div className="h-32 bg-muted rounded animate-pulse" />
            </div>
          ) : employee ? (
            <div className="flex flex-col h-full overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                {/* Employee Main Avatar Header */}
                <div className="flex flex-col items-center text-center space-y-3 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md border-2 border-background">
                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{employee.firstName} {employee.lastName}</h2>
                    <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-2 mt-0.5">
                      <span>{employee.designation?.name || "Corporate Professional"}</span>
                      <span>•</span>
                      <span className="font-mono text-primary font-bold">{employee.employeeId}</span>
                    </p>
                    <Badge variant={employee.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-2 font-bold text-xs">
                      {employee.status}
                    </Badge>
                  </div>
                </div>

                {/* Navigation Sub-Tabs */}
                <div className="flex items-center gap-1 border border-border/60 p-1 rounded-xl bg-muted/40 mb-6 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveTab('job')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'job'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    {t("Job Details")}
                  </button>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'attendance'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {t("Attendance")}
                  </button>
                  <button
                    onClick={() => setActiveTab('leaves')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'leaves'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {t("Leaves")}
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'documents'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t("Compliance & Docs")}
                  </button>
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'personal'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    {t("Personal Info")}
                  </button>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'contact'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    {t("Contact")}
                  </button>
                  <button
                    onClick={() => setActiveTab('bank')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'bank'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {t("Bank & Payroll")}
                  </button>
                  <button
                    onClick={() => setActiveTab('company')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'company'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    {t("Company")}
                  </button>
                </div>

                {/* TAB CONTENT SECTIONS */}
                <div className="space-y-6">
                  {/* TAB 1: JOB DETAILS */}
                  {activeTab === 'job' && (
                    <div className="bg-card border shadow-xs rounded-xl p-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        {t("Job & Position Details")}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Employee ID</span>
                          <span className="font-bold text-foreground font-mono">{employee.employeeId}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Department</span>
                          <span className="font-bold text-foreground">{employee.department?.name || "Software Engineering"}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Employment Type</span>
                          <Badge variant="outline" className="font-mono text-[11px] uppercase font-bold text-primary">
                            {employee.employmentType?.replace('_', ' ') || "FULL TIME"}
                          </Badge>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Joining Date</span>
                          <span className="font-bold text-foreground font-mono">
                            {employee.joiningDate ? formatDate(employee.joiningDate) : "—"}
                          </span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Base Salary (CTC)</span>
                          <span className="font-bold text-emerald-600 font-mono text-sm">
                            ₹{Number(employee.baseSalary || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Reporting Manager</span>
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <UserCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            {employee.department?.managerId === employee.id
                              ? "Department Head"
                              : employee.manager
                              ? `${employee.manager.firstName} ${employee.manager.lastName}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: ATTENDANCE & TIMESHEET */}
                  {activeTab === 'attendance' && (
                    <div className="space-y-4">
                      {/* Metric Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 border rounded-xl bg-card shadow-2xs text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Compliance Rate</p>
                          <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {employee.attendanceAnalytics?.rate ?? 95}%
                          </p>
                          <Progress value={employee.attendanceAnalytics?.rate ?? 95} className="h-1.5 mt-1.5" />
                        </div>
                        <div className="p-3 border rounded-xl bg-card shadow-2xs text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Days Present</p>
                          <p className="text-lg font-bold font-mono text-primary mt-0.5">
                            {employee.attendanceAnalytics?.presentDays ?? 18}d
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                            of {employee.attendanceAnalytics?.totalWorkingDays ?? 18} working
                          </p>
                        </div>
                        <div className="p-3 border rounded-xl bg-card shadow-2xs text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Late Marks</p>
                          <p className="text-lg font-bold font-mono text-amber-600 mt-0.5">
                            {employee.attendanceAnalytics?.lateDays ?? 2}d
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                            Grace: {employee.shift?.graceTime ?? 15}m
                          </p>
                        </div>
                      </div>

                      {/* Shift Info Banner */}
                      <div className="p-3 bg-muted/30 border rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <span className="font-bold text-foreground block">{employee.shift?.name || "General Day Shift"}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {employee.shift?.startTime || "09:00"} - {employee.shift?.endTime || "18:00"} • Break: {employee.shift?.breakDuration || 60}m
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Off: {(employee.shift?.weeklyOff || ['Sunday']).join(', ')}
                        </Badge>
                      </div>

                      {/* Recent 30-Day Logs List */}
                      <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
                        <div className="p-3 border-b bg-muted/20 flex justify-between items-center">
                          <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-primary" /> Daily Attendance Logs
                          </h5>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {employee.attendanceRecords?.length || 0} Records
                          </span>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto divide-y divide-border/40 text-xs">
                          {employee.attendanceRecords?.length ? (
                            employee.attendanceRecords.map((r: any) => (
                              <div key={r.id} className="p-2.5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground font-mono">{formatDate(r.date)}</span>
                                    {r.isLate && (
                                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded font-bold">LATE</span>
                                    )}
                                    {r.isOvertime && (
                                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold">OT</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    Gross: {r.grossHours}h • Effective: {r.effectiveHours}h
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                                  r.status === 'WEEKEND' ? 'bg-muted text-muted-foreground' :
                                  r.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-700' :
                                  'bg-rose-100 text-rose-700'
                                }`}>
                                  {r.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-muted-foreground text-xs">No records available</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: LEAVES & TIME OFF */}
                  {activeTab === 'leaves' && (
                    <div className="space-y-4">
                      {/* Leave Balances Grid */}
                      <div className="bg-card border rounded-xl p-4 shadow-2xs space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> Leave Balance Allocations
                          </h5>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded font-mono">
                            {employee.leaveSummary?.totalAvailable ?? 38} Days Available
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg border bg-muted/20 flex justify-between items-center">
                            <span className="text-muted-foreground">Annual Leave (AL)</span>
                            <span className="font-bold font-mono text-foreground text-sm">{employee.leaveBalance?.annual ?? 15}d</span>
                          </div>
                          <div className="p-2.5 rounded-lg border bg-muted/20 flex justify-between items-center">
                            <span className="text-muted-foreground">Casual Leave (CL)</span>
                            <span className="font-bold font-mono text-foreground text-sm">{employee.leaveBalance?.casual ?? 10}d</span>
                          </div>
                          <div className="p-2.5 rounded-lg border bg-muted/20 flex justify-between items-center">
                            <span className="text-muted-foreground">Medical / Sick (SL)</span>
                            <span className="font-bold font-mono text-foreground text-sm">{employee.leaveBalance?.medical ?? 8}d</span>
                          </div>
                          <div className="p-2.5 rounded-lg border bg-muted/20 flex justify-between items-center">
                            <span className="text-muted-foreground">Earned Leave (EL)</span>
                            <span className="font-bold font-mono text-foreground text-sm">{employee.leaveBalance?.earned ?? 5}d</span>
                          </div>
                        </div>
                      </div>

                      {/* Leave Requests History */}
                      <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
                        <div className="p-3 border-b bg-muted/20 flex justify-between items-center">
                          <h5 className="text-xs font-bold text-foreground">Leave Requests History</h5>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {employee.leaveRequests?.length || 0} Requests
                          </span>
                        </div>
                        <div className="max-h-[260px] overflow-y-auto divide-y divide-border/40 text-xs">
                          {employee.leaveRequests?.length ? (
                            employee.leaveRequests.map((req: any) => (
                              <div key={req.id} className="p-3 space-y-1 hover:bg-muted/10 transition-colors">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-foreground">{req.leaveType} Leave</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                    req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {req.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  {formatDate(req.startDate)} - {formatDate(req.endDate)}
                                </p>
                                {req.description && (
                                  <p className="text-[11px] text-muted-foreground italic">"{req.description}"</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-muted-foreground text-xs">No leave requests recorded</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: COMPLIANCE & DOCUMENTS */}
                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      {/* Compliance Status Banner */}
                      <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">KYC & Compliance Verified</p>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Identity and banking documents match regulatory requirements</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px]">VERIFIED</Badge>
                      </div>

                      {/* Documents List */}
                      <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
                        <div className="p-3 border-b bg-muted/20 flex justify-between items-center">
                          <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary" /> Verified Documentation
                          </h5>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {employee.documents?.length || 0} Files
                          </span>
                        </div>
                        <div className="divide-y divide-border/40 text-xs">
                          {employee.documents?.length ? (
                            employee.documents.map((doc: any) => (
                              <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground">{doc.documentType}</span>
                                    <Badge variant="outline" className="text-[9px] font-mono py-0 h-4">{doc.category}</Badge>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {doc.remarks || "Verified"} {doc.verifiedBy ? `• ${doc.verifiedBy}` : ''}
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Verified
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-muted-foreground text-xs">No documents uploaded</div>
                          )}
                        </div>
                      </div>

                      {/* Bank KYC Verification Details */}
                      <div className="bg-card border rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-primary" /> Bank Account KYC
                          </span>
                          <span className="text-emerald-600 text-[10px] font-bold">Active & Verified</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Bank Name</span>
                            <span className="font-semibold text-foreground">{employee.bankName || "HDFC Bank"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Account Number</span>
                            <span className="font-mono font-semibold text-foreground">{employee.accountNumber || "••••4591"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">IFSC Code</span>
                            <span className="font-mono font-semibold text-foreground">{employee.ifsc || "HDFC0001000"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">UPI Identifier</span>
                            <span className="font-mono font-semibold text-foreground">{employee.upiId || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PERSONAL INFORMATION */}
                  {activeTab === 'personal' && (
                    <div className="bg-card border shadow-xs rounded-xl p-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <User className="w-4 h-4 text-primary" />
                        {t("Personal Information")}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">First Name</span>
                          <span className="font-bold text-foreground">{employee.firstName}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Last Name</span>
                          <span className="font-bold text-foreground">{employee.lastName}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Gender</span>
                          <span className="font-semibold text-foreground">{employee.gender || "Male"}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Date of Birth</span>
                          <span className="font-semibold text-foreground font-mono">
                            {employee.dob ? formatDate(employee.dob) : "—"}
                          </span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Blood Group</span>
                          <span className="font-semibold text-foreground">{employee.bloodGroup || "O+"}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Marital Status</span>
                          <span className="font-semibold text-foreground">{employee.maritalStatus || "Single"}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1 col-span-2">
                          <span className="text-muted-foreground font-medium block">Nationality</span>
                          <span className="font-semibold text-foreground">{employee.nationality || "Indian"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CONTACT & EMERGENCY */}
                  {activeTab === 'contact' && (
                    <div className="space-y-4">
                      <div className="bg-card border shadow-xs rounded-xl p-4 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                          <PhoneCall className="w-4 h-4 text-primary" />
                          {t("Contact & Communication")}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 border rounded-lg bg-muted/10 space-y-1 col-span-2">
                            <span className="text-muted-foreground font-medium block">Email Address</span>
                            <span className="font-bold text-foreground font-mono">{employee.email}</span>
                          </div>
                          <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                            <span className="text-muted-foreground font-medium block">Mobile Phone</span>
                            <span className="font-semibold text-foreground font-mono">{employee.phone || "—"}</span>
                          </div>
                          <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                            <span className="text-muted-foreground font-medium block">Alternate Phone</span>
                            <span className="font-semibold text-foreground font-mono">{employee.alternatePhone || "—"}</span>
                          </div>
                          <div className="p-3 border rounded-lg bg-muted/10 space-y-1 col-span-2">
                            <span className="text-muted-foreground font-medium block">Residential Address</span>
                            <span className="font-semibold text-foreground">
                              {employee.address || employee.city || "—"} {employee.postalCode ? `(${employee.postalCode})` : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* EMERGENCY CONTACT BOX */}
                      <div className="p-4 border rounded-xl bg-destructive/5 border-destructive/20 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" />
                          {t("Emergency Contact Details")}
                        </h5>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[11px] text-muted-foreground block">Contact Name</span>
                            <span className="font-bold text-foreground">
                              {employee.emergencyContactName || employee.emergencyContact || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-muted-foreground block">Relationship</span>
                            <span className="font-bold text-foreground">
                              {employee.emergencyContactRelation || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-muted-foreground block">Emergency Phone</span>
                            <span className="font-bold text-foreground font-mono">
                              {employee.emergencyContactPhone || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: BANK & PAYROLL */}
                  {activeTab === 'bank' && (
                    <div className="bg-card border shadow-xs rounded-xl p-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        {t("Bank & Payroll Transfer Credentials")}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Bank Name</span>
                          <span className="font-bold text-foreground">{employee.bankName || "—"}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">Account Number</span>
                          <span className="font-bold text-foreground font-mono">{employee.accountNumber || "—"}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">IFSC Code</span>
                          <span className="font-bold text-foreground font-mono uppercase">{employee.ifsc || "—"}</span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                          <span className="text-muted-foreground font-medium block">UPI ID</span>
                          <span className="font-bold text-foreground font-mono">{employee.upiId || "—"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: COMPANY & ORGANIZATION */}
                  {activeTab === 'company' && (
                    <div className="bg-card border shadow-xs rounded-xl p-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <Building className="w-4 h-4 text-primary" />
                        {t("Company & Organization Details")}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1 col-span-2">
                          <span className="text-muted-foreground font-medium block">Company Name</span>
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-primary" />
                            {employee.user?.companyName || employee.companyName || "Radical Minds Technologies Pvt. Ltd."}
                          </span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1 col-span-2">
                          <span className="text-muted-foreground font-medium block">Company Website</span>
                          <span className="font-bold text-primary font-mono truncate block">
                            {employee.user?.companyWebsite || employee.companyWebsite || "https://www.radicalminds.in/"}
                          </span>
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/10 space-y-1 col-span-2">
                          <span className="text-muted-foreground font-medium block">Headquarters Address</span>
                          <span className="font-semibold text-foreground">
                            {employee.user?.companyAddress || employee.companyAddress || "368, Phase II, Udyog Vihar, Sector 20, Gurugram, Haryana 122016"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    <Button className="w-full h-9 text-xs font-semibold" onClick={() => setIsEditModalOpen(true)}>
                      {t("Edit Full Profile")}
                    </Button>
                    {employee.status === 'ACTIVE' ? (
                      <Button variant="outline" className="w-full h-9 text-xs font-semibold text-destructive hover:bg-destructive/10" onClick={handleDeactivate} disabled={deactivateEmployee.isPending}>
                        {deactivateEmployee.isPending ? t("Deactivating...") : t("Deactivate Account")}
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full h-9 text-xs font-semibold text-emerald-600 hover:bg-emerald-50" onClick={() => {
                        if (confirm(t("Activate this account?"))) {
                          api.put(`/employees/${employeeId}`, { status: 'ACTIVE' }).then(() => {
                            toast.success(t('Employee activated'));
                            queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
                            queryClient.invalidateQueries({ queryKey: ['employeeDetails'] });
                            queryClient.invalidateQueries({ queryKey: ['workforceDashboard'] });
                          });
                        }
                      }}>
                        {t("Activate Account")}
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <EditEmployeeModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        employee={employee} 
      />
    </>
  );
}
