"use client";

import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTranslation } from 'react-i18next';
import { Users, Briefcase, CalendarCheck, Clock, ShieldCheck, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

import { EmployeeDashboard } from './components/EmployeeDashboard';
import { HRManagerDashboard } from './components/HRManagerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { AttendancePunchWidget } from '@/components/shared/AttendancePunchWidget';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const { data: profileRes } = useQuery({ 
    queryKey: ["auth_profile"], 
    queryFn: async () => (await api.get("/profile")).data 
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const role = typeof user?.role === 'string' ? user.role.toUpperCase().trim().replace(/\s+/g, '_') : '';

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pt-2 sm:pt-4 pb-10">
      <PageHeader 
        title="Overview" 
        description={`${t('Welcome back,')} ${profileRes?.data?.firstName || user?.email || 'User'}!`}
        showSearch={false}
        showFilters={false}
        showCreate={false}
        showImport={false}
        showExport={false}
      />
      
      {role === 'EMPLOYEE' && <EmployeeDashboard stats={stats} />}
      {(role === 'HR_MANAGER' || role === 'HR_ADMIN') && <HRManagerDashboard stats={stats} />}
      {role === 'SUPER_ADMIN' && <SuperAdminDashboard stats={stats} />}
      {!['EMPLOYEE', 'HR_MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(role) && (
        <div className="p-8 text-center text-muted-foreground">No dashboard available for your role ({user?.role}).</div>
      )}
    </div>
  );
}
