"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, CalendarDays, AlertCircle, Briefcase, Percent, Activity } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { CelebrationsCard } from '@/components/dashboard/CelebrationsCard';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable';
import { RecruitmentPipelineCard } from '@/components/dashboard/RecruitmentPipelineCard';

export function HRManagerDashboard({ stats }: { stats: any, trendFilter?: string, setTrendFilter?: (val: string) => void }) {
  const { t } = useTranslation();
  const router = useRouter();

  const getKPIDestination = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('employee')) return '/dashboard/employee-management';
    if (lower.includes('present')) return '/dashboard/attendance';
    if (lower.includes('rate') || lower.includes('percentage') || lower.includes('attendance')) return '/dashboard/attendance';
    if (lower.includes('leave')) return '/dashboard/leave-management?status=APPROVED';
    if (lower.includes('pending') || lower.includes('approval')) return '/dashboard/leave-management?status=PENDING';
    if (lower.includes('recruitment') || lower.includes('job')) return '/dashboard/recruitment';
    return '/dashboard/employee-management';
  };

  const deptColumns = [
    { 
      header: t("Department"), 
      accessor: (row: any) => (
        <span className="font-semibold text-foreground text-xs">{row.department}</span>
      )
    },
    { 
      header: t("Present"), 
      accessor: (row: any) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{row.present}</span>
      )
    },
    { 
      header: t("Absent"), 
      accessor: (row: any) => (
        <span className="text-rose-600 dark:text-rose-400 font-bold text-xs">{row.absent}</span>
      )
    },
    { 
      header: t("On Leave"), 
      accessor: (row: any) => (
        <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">{row.onLeave}</span>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 6-Column Responsive KPI Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {stats?.metrics?.map((metric: any, i: number) => {
          let icon = Users;
          let color = "text-blue-600 dark:text-blue-400";
          let bg = "bg-blue-500/10";
          let cardBg = "bg-card";
          
          if (metric.title.includes('Present')) { icon = UserCheck; color = "text-emerald-600 dark:text-emerald-400"; bg = "bg-emerald-500/10"; }
          if (metric.title.includes('Leave')) { icon = CalendarDays; color = "text-amber-600 dark:text-amber-400"; bg = "bg-amber-500/10"; }
          if (metric.title.includes('Pending')) { icon = AlertCircle; color = "text-rose-600 dark:text-rose-400"; bg = "bg-rose-500/10"; }
          if (metric.title.includes('Recruitment')) { icon = Briefcase; color = "text-purple-600 dark:text-purple-400"; bg = "bg-purple-500/10"; }
          if (metric.title.includes('Rate') || metric.title.includes('Percentage')) { icon = Percent; color = "text-indigo-600 dark:text-indigo-400"; bg = "bg-indigo-500/10"; }

          const destination = getKPIDestination(metric.title);

          return (
            <KPICard 
              key={i} 
              title={t(metric.title)} 
              value={metric.value} 
              trend={metric.trend}
              icon={icon}
              colorClass={color}
              bgClass={bg}
              cardBgClass={cardBg}
              onClick={() => router.push(destination)}
            />
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Left Column (Takes up 8 columns out of 12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Full-Width Department Attendance Summary Table */}
          <div className="w-full">
            <DashboardDataTable 
              title={t("Department Attendance Summary")} 
              data={stats?.deptAttendance || []} 
              columns={deptColumns}
            />
          </div>
          
          {/* Middle Row: Pending Tasks & Recruitment Pipeline */}
          <div className="grid gap-6 md:grid-cols-2">
            <PendingTasks tasks={stats?.pendingTasks || []} />
            <RecruitmentPipelineCard pipeline={stats?.pipeline} />
          </div>  

        </div>

        {/* Right Sidebar Column (Takes up 4 columns out of 12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Celebrations Widget */}
          <CelebrationsCard
            upcomingBirthdays={stats?.upcomingBirthdays || []}
            workAnniversaries={stats?.workAnniversaries || []}
          />

          <div className="rounded-xl border bg-card shadow-xs p-5">
            <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {t("Recent Activities")}
            </h3>
            <ActivityTimeline activities={stats?.recentActivities || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

