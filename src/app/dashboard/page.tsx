"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Briefcase,
  CalendarCheck,
  Clock,
  ShieldCheck,
  FileText,
  Loader2,
  Calendar,
  Zap,
  Building2,
  User,
  ChevronDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EmployeeDashboard } from './components/EmployeeDashboard';
import { HRManagerDashboard } from './components/HRManagerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const { data: profileRes } = useQuery({ 
    queryKey: ["auth_profile"], 
    queryFn: async () => (await api.get("/profile")).data 
  });

  const [trendFilter, setTrendFilter] = useState("30d");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard_stats", trendFilter],
    queryFn: async () => {
      const res = await api.get(`/dashboard/stats?trend=${trendFilter}`);
      return res.data.data;
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">{t('Loading dashboard...')}</p>
      </div>
    );
  }

  const role = typeof user?.role === 'string' ? user.role.toUpperCase().trim().replace(/\s+/g, '_') : '';

  const displayName = profileRes?.data?.firstName 
    ? `${profileRes.data.firstName} ${profileRes.data.lastName || ''}`.trim() 
    : user?.firstName 
      ? `${user.firstName} ${user.lastName || ''}`.trim() 
      : user?.email ? user.email.split('@')[0] : 'User';

  const todayFormatted = format(new Date(), 'EEEE, dd MMM yyyy');

  const actionButton = (
    <div className="flex items-center gap-2.5">
      {/* Live Date Badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs font-semibold text-foreground shadow-2xs">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <span>{todayFormatted}</span>
      </div>

      {/* Quick Actions Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Quick Actions</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 p-1.5 text-xs">
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
            Shortcuts & Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {role === 'EMPLOYEE' && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/leave-request" className="flex items-center gap-2 py-1.5">
                  <CalendarCheck className="w-4 h-4 text-amber-600" />
                  <span>Request Leave</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/my-attendance" className="flex items-center gap-2 py-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>My Attendance Logs</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/payslips" className="flex items-center gap-2 py-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>View Payslips</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/profile" className="flex items-center gap-2 py-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {role === 'MANAGER' && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/employee-management" className="flex items-center gap-2 py-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>My Team</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/leave-management" className="flex items-center gap-2 py-1.5">
                  <CalendarCheck className="w-4 h-4 text-amber-600" />
                  <span>Approve Leaves</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/attendance" className="flex items-center gap-2 py-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Team Attendance</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {(role === 'HR_MANAGER' || role === 'HR_ADMIN') && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/employee-management" className="flex items-center gap-2 py-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Employee Management</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/leave-management" className="flex items-center gap-2 py-1.5">
                  <CalendarCheck className="w-4 h-4 text-amber-600" />
                  <span>Approve Leaves</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/payroll" className="flex items-center gap-2 py-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Process Payroll</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {role === 'SUPER_ADMIN' && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/tenant-employees" className="flex items-center gap-2 py-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Tenant Employees</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/users" className="flex items-center gap-2 py-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Users Directory</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/audit-logs" className="flex items-center gap-2 py-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>System Audit Logs</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pt-2 sm:pt-4 pb-10">
      <PageHeader 
        title="Overview" 
        description={`${t('Welcome back,')} ${displayName}!`}
        showSearch={false}
        showFilters={false}
        showCreate={false}
        showImport={false}
        showExport={false}
        actionButton={actionButton}
      />
      
      {role === 'EMPLOYEE' && <EmployeeDashboard stats={stats} />}
      {(role === 'HR_MANAGER' || role === 'HR_ADMIN') && <HRManagerDashboard stats={stats} trendFilter={trendFilter} setTrendFilter={setTrendFilter} />}
      {role === 'MANAGER' && <ManagerDashboard stats={stats} />}
      {role === 'SUPER_ADMIN' && <SuperAdminDashboard stats={stats} />}
      {!['EMPLOYEE', 'HR_MANAGER', 'HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(role) && (
        <div className="p-8 text-center text-muted-foreground">No dashboard available for your role ({user?.role}).</div>
      )}
    </div>
  );
}
