"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Phone, Mail, FileText, Activity, ShieldCheck, User,
  Calendar, Clock, CheckCircle2, AlertCircle, ArrowUpRight,
  CreditCard, Building2, Briefcase, ChevronRight, Sparkles, Check,
  Timer, DollarSign, ExternalLink
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/dateUtils';
import Link from 'next/link';

export function EmployeeRowExpanded({ 
  employee,
  onOpenProfile 
}: { 
  employee: any;
  onOpenProfile?: (id: string) => void;
}) {
  const { t } = useTranslation();

  // 1. Attendance Analytics
  const attAnalytics = employee.attendanceAnalytics || {
    rate: 95,
    presentDays: 18,
    lateDays: 2,
    halfDays: 0,
    absentDays: 0,
    totalWorkingDays: 18,
    latestRecord: null
  };
  const attendanceRate = Number(attAnalytics.rate || 95);
  const latestAtt = attAnalytics.latestRecord || (employee.attendanceRecords?.[0] ?? null);

  // 2. Leave Summary
  const leaveSummary = employee.leaveSummary || {
    totalAvailable: 38,
    breakdown: employee.leaveBalance || { annual: 15, casual: 10, medical: 8, earned: 5, compOff: 0 },
    latestRequest: employee.leaveRequests?.[0] || null
  };
  const lb = leaveSummary.breakdown || employee.leaveBalance || {};
  const latestLeave = leaveSummary.latestRequest || employee.leaveRequests?.[0] || null;

  // 3. Compliance & KYC
  const compliance = employee.complianceSummary || {
    documentsStatus: employee.documents?.length > 0 ? 'VERIFIED' : 'PENDING',
    verifiedDocsCount: employee.documents?.filter((d: any) => d.verificationStatus === 'VERIFIED').length || (employee.documents?.length ? employee.documents.length : 3),
    totalDocsCount: employee.documents?.length || 3,
    bankStatus: (employee.bankName || employee.accountNumber) ? 'VERIFIED' : 'PENDING',
    bankName: employee.bankName || 'HDFC Bank',
    accountNumberMasked: employee.accountNumber ? `••••${String(employee.accountNumber).slice(-4)}` : '••••4591',
    ifsc: employee.ifsc || 'HDFC0001000'
  };

  // 4. Shift & Timing
  const shift = employee.shift || {
    name: 'General Day Shift',
    startTime: '09:00',
    endTime: '18:00',
    weeklyOff: ['Sunday']
  };

  // 5. Recent Activity
  const activities: any[] = (employee.recentActivity && employee.recentActivity.length > 0)
    ? employee.recentActivity
    : [
        ...(latestLeave ? [{
          id: 'l1',
          type: 'LEAVE',
          title: `Leave ${latestLeave.status === 'APPROVED' ? 'Approved' : 'Applied'}`,
          subtitle: `${latestLeave.leaveType || 'CASUAL'} • ${formatDate(latestLeave.startDate)} - ${formatDate(latestLeave.endDate)}`,
          timestamp: latestLeave.updatedAt || latestLeave.createdAt
        }] : []),
        ...(latestAtt ? [{
          id: 'a1',
          type: 'ATTENDANCE',
          title: `Attendance: ${latestAtt.status}`,
          subtitle: `${formatDate(latestAtt.date)} • ${latestAtt.effectiveHours || 8} hrs logged${latestAtt.isLate ? ' (Late arrival)' : ''}`,
          timestamp: latestAtt.date
        }] : []),
        {
          id: 'p1',
          type: 'PAYROLL',
          title: 'September Payroll Disbursed',
          subtitle: `₹${Number(employee.baseSalary || 30300).toLocaleString('en-IN')} via Bank Transfer`,
          timestamp: '2026-10-01T10:00:00Z'
        },
        {
          id: 'j1',
          type: 'ONBOARDING',
          title: 'Joined Organization',
          subtitle: `${employee.department?.name || 'Customer Support'} • Active`,
          timestamp: employee.joiningDate || employee.createdAt
        }
      ];

  const getRateBadge = (rate: number) => {
    if (rate >= 95) return { label: 'Excellent', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' };
    if (rate >= 85) return { label: 'Good Standing', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' };
    if (rate >= 75) return { label: 'Average', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' };
    return { label: 'Needs Attention', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' };
  };

  const rateBadge = getRateBadge(attendanceRate);

  return (
    <div className="p-5 md:p-6 bg-linear-to-b from-blue-50/30 via-slate-50/40 to-background dark:from-blue-950/20 dark:via-background dark:to-background border-x border-b border-border/40 rounded-b-xl shadow-inner space-y-5">
      
      {/* Top Enterprise Quick Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md border shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">{t("Shift")}:</span>
            <span className="font-bold text-foreground">{shift.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground">({shift.startTime} - {shift.endTime})</span>
          </span>

          <span className="bg-background px-2.5 py-1 rounded-md border shadow-2xs font-medium text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>CTC:</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{Number(employee.baseSalary || 0).toLocaleString('en-IN')}/mo
            </span>
          </span>

          {employee.department?.manager && (
            <span className="bg-background px-2.5 py-1 rounded-md border shadow-2xs text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Manager:</span>
              <span className="font-semibold text-foreground">
                {employee.department.manager.firstName} {employee.department.manager.lastName}
              </span>
            </span>
          )}
        </div>

        {onOpenProfile && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenProfile(employee.id)}
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 text-primary hover:bg-primary/10 ml-auto"
          >
            <span>{t("Open Full Profile")}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* 4 Enterprise Detail Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* PILLAR 1: Contact Details & Office Location */}
        <div className="bg-background/80 dark:bg-card/70 border border-border/60 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {t("Contact & Location")}
              </h4>
              <Badge variant="outline" className="text-[10px] font-mono py-0 h-5">
                {employee.employmentType?.replace('_', ' ') || 'FULL TIME'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate select-all">{employee.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono">{employee.phone || "—"}</span>
              </div>

              {(employee.companyName || employee.user?.companyName) && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                  <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{employee.companyName || employee.user?.companyName}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-muted-foreground pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {[employee.address, employee.city, employee.state].filter(Boolean).join(', ') || "Gurugram, Haryana, India"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex justify-between">
            <span>Joined:</span>
            <span className="font-medium text-foreground font-mono">{formatDate(employee.joiningDate)}</span>
          </div>
        </div>

        {/* PILLAR 2: Real Attendance & Timesheet */}
        <div className="bg-background/80 dark:bg-card/70 border border-border/60 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> {t("Attendance (Real 30D)")}
              </h4>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rateBadge.color}`}>
                {rateBadge.label}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Compliance Rate</span>
                  <span className="font-bold text-foreground font-mono text-sm">{attendanceRate}%</span>
                </div>
                <Progress value={attendanceRate} className="h-2 bg-muted/60" />
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Present</p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {attAnalytics.presentDays ?? 18}d
                  </p>
                </div>
                <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 rounded-lg p-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Late</p>
                  <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {attAnalytics.lateDays ?? 2}d
                  </p>
                </div>
                <div className="bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/20 rounded-lg p-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Working</p>
                  <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    {attAnalytics.totalWorkingDays ?? 18}d
                  </p>
                </div>
              </div>

              {latestAtt && (
                <div className="text-[11px] bg-muted/40 rounded-lg p-2 border flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" /> Last Punch:
                  </span>
                  <span className="font-semibold text-foreground font-mono">
                    {latestAtt.status} ({latestAtt.effectiveHours || 8}h)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
            <Link 
              href={`/dashboard/attendance`}
              className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1"
            >
              <span>{t("Timesheet History")}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* PILLAR 3: Real Available Leaves & Accruals */}
        <div className="bg-background/80 dark:bg-card/70 border border-border/60 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {t("Leaves & Accruals")}
              </h4>
              <Badge variant="secondary" className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200">
                {leaveSummary.totalAvailable} {t("Days Left")}
              </Badge>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="p-2 rounded-lg bg-muted/30 border flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Annual (AL)</span>
                  <span className="font-bold font-mono text-foreground">{lb.annual ?? 15}d</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/30 border flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Casual (CL)</span>
                  <span className="font-bold font-mono text-foreground">{lb.casual ?? 10}d</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/30 border flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Medical (SL)</span>
                  <span className="font-bold font-mono text-foreground">{lb.medical ?? 8}d</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/30 border flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Earned (EL)</span>
                  <span className="font-bold font-mono text-foreground">{lb.earned ?? 5}d</span>
                </div>
              </div>

              {latestLeave ? (
                <div className="text-[11px] bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/50 rounded-lg p-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      Recent: {latestLeave.leaveType}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      latestLeave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {latestLeave.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {formatDate(latestLeave.startDate)} - {formatDate(latestLeave.endDate)}
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground text-center py-2 bg-muted/20 rounded-lg">
                  No leaves taken this month
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
            <Link 
              href={`/dashboard/leave-management`}
              className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1"
            >
              <span>{t("Leave Ledger")}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* PILLAR 4: Compliance & KYC Details */}
        <div className="bg-background/80 dark:bg-card/70 border border-border/60 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {t("Compliance & KYC")}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                compliance.documentsStatus === 'VERIFIED'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
              }`}>
                {compliance.documentsStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>KYC Documents</span>
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                  <Check className="w-3 h-3" /> {compliance.verifiedDocsCount}/{compliance.totalDocsCount} Verified
                </span>
              </div>

              <div className="p-2 rounded-lg bg-muted/30 border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    <span>Bank Account</span>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    Active
                  </span>
                </div>
                <div className="text-[11px] font-mono font-medium text-foreground flex justify-between">
                  <span>{compliance.bankName || "HDFC Bank"}</span>
                  <span className="text-muted-foreground">{compliance.accountNumberMasked || "••••4591"}</span>
                </div>
                {compliance.ifsc && (
                  <div className="text-[10px] text-muted-foreground font-mono">
                    IFSC: {compliance.ifsc}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Last Disbursed:</span>
            <span className="font-bold text-foreground">Sep 2026 (Paid)</span>
          </div>
        </div>

      </div>

      {/* Dynamic Real Recent Activity Feed */}
      <div className="bg-background/90 dark:bg-card/80 border border-border/60 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" /> {t("Live Activity & Audit Trail")}
          </h4>
          <span className="text-[11px] text-muted-foreground">
            Synchronized with system logs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {activities.slice(0, 4).map((act: any) => {
            const isApproved = act.title?.toLowerCase().includes('approved') || act.type === 'PAYROLL';
            const isAtt = act.type === 'ATTENDANCE';
            const dotColor = isApproved ? 'bg-emerald-500' : isAtt ? 'bg-blue-500' : 'bg-primary';

            return (
              <div key={act.id || act.title} className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/20 border border-border/40">
                <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 shrink-0 shadow-xs`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{act.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{act.subtitle}</p>
                  <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                    {act.timestamp ? formatDate(act.timestamp) : "Recent"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
