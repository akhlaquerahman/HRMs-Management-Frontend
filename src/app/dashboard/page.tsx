"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTranslation } from 'react-i18next';
import { Users, Briefcase, CalendarCheck, Clock, ShieldCheck, FileText, Loader2, LogIn, LogOut, MapPin } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';

import { EmployeeDashboard } from './components/EmployeeDashboard';
import { HRManagerDashboard } from './components/HRManagerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { AttendancePunchWidget } from '@/components/shared/AttendancePunchWidget';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const [isPunchingOut, setIsPunchingOut] = useState(false);

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

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['attendance_status'],
    queryFn: async () => (await api.get('/attendance/status')).data.data,
    refetchInterval: 60000 
  });

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">{t('Loading dashboard...')}</p>
      </div>
    );
  }

  const role = typeof user?.role === 'string' ? user.role.toUpperCase().trim().replace(/\s+/g, '_') : '';

  const handlePunchIn = async () => {
    setIsPunchingIn(true);
    try {
      await api.post('/attendance/punch-in', {});
      toast.success("Checked in successfully!");
      queryClient.invalidateQueries({ queryKey: ['attendance_status'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error punching in");
    } finally {
      setIsPunchingIn(false);
    }
  };

  const handlePunchOut = async () => {
    setIsPunchingOut(true);
    try {
      await api.post('/attendance/punch-out');
      toast.success("Checked out successfully!");
      queryClient.invalidateQueries({ queryKey: ['attendance_status'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error punching out");
    } finally {
      setIsPunchingOut(false);
    }
  };

  const currentState = statusData?.currentState || "NOT_PUNCHED_IN";
  const activeShift = statusData?.shift;
  const currentRecord = statusData?.record;

  let isCheckInAllowed = true;
  if (currentState === "NOT_PUNCHED_IN" && activeShift) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = activeShift.startTime.split(':').map(Number);
    const [endHour, endMin] = activeShift.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    let isNightShift = endMinutes < startMinutes;
    isCheckInAllowed = false;
    
    if (isNightShift) {
      if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
         isCheckInAllowed = true;
      }
    } else {
      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
         isCheckInAllowed = true;
      }
    }
  }

  let actionButton = null;
  if (role === 'EMPLOYEE') {
    if (statusLoading) {
      actionButton = <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />;
    } else if (currentState === "NOT_PUNCHED_IN") {
      if (!isCheckInAllowed) {
        actionButton = (
          <span className="text-sm font-semibold text-destructive px-4 py-2 border border-destructive/20 bg-destructive/10 rounded-lg shadow-sm">
            Shift Time: {activeShift?.startTime} - {activeShift?.endTime}
          </span>
        );
      } else {
        actionButton = (
          <Button size="default" className="font-semibold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePunchIn} disabled={isPunchingIn}>
            {isPunchingIn ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />} Check In
          </Button>
        );
      }
    } else if (currentState === "PUNCHED_IN") {
      actionButton = (
        <div className="flex items-center gap-4 bg-card border rounded-xl p-1.5 pr-2 shadow-sm">
          <div className="flex flex-col pl-3 hidden md:flex">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="w-3 h-3 text-primary" />
              <span>HQ Office</span>
              {activeShift && (
                <span className="ml-2 px-1.5 py-0.5 bg-muted border rounded-md text-[10px]">
                  {activeShift.name} ({activeShift.startTime} - {activeShift.endTime})
                </span>
              )}
            </div>
            <div className="text-sm font-semibold mt-0.5">
              Working since {currentRecord?.logs?.[0]?.punchIn ? format(new Date(currentRecord.logs[0].punchIn), 'hh:mm a') : ''}
            </div>
          </div>
          <div className="h-8 w-px bg-border hidden md:block mx-1"></div>
          <Button size="default" variant="destructive" className="font-semibold rounded-lg shadow-md" onClick={handlePunchOut} disabled={isPunchingOut}>
            {isPunchingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />} Check Out
          </Button>
        </div>
      );
    } else if (currentState === "ON_BREAK") {
      actionButton = (
        <Button size="default" variant="outline" className="font-semibold shadow-md">
          Resume Work
        </Button>
      );
    } else {
      actionButton = <span className="text-sm font-semibold text-green-600 px-4 py-2 bg-green-50 border rounded-lg shadow-sm">Shift Completed</span>;
    }
  }

  const displayName = profileRes?.data?.firstName 
    ? `${profileRes.data.firstName} ${profileRes.data.lastName || ''}`.trim() 
    : user?.firstName 
      ? `${user.firstName} ${user.lastName || ''}`.trim() 
      : user?.email ? user.email.split('@')[0] : 'User';

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
      {role === 'SUPER_ADMIN' && <SuperAdminDashboard stats={stats} />}
      {!['EMPLOYEE', 'HR_MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(role) && (
        <div className="p-8 text-center text-muted-foreground">No dashboard available for your role ({user?.role}).</div>
      )}
    </div>
  );
}
