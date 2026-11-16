"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, CalendarDays, AlertCircle, Briefcase, Percent } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { CelebrationsCard } from '@/components/dashboard/CelebrationsCard';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { RecruitmentPipelineCard } from '@/components/dashboard/RecruitmentPipelineCard';
import { LiveAttendanceMapSection } from '@/components/dashboard/LiveAttendanceMapSection';

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

      {/* Live Attendance & Punch-In Location Map Section (with Integrated Department Attendance Summary) */}
      <LiveAttendanceMapSection deptAttendance={stats?.deptAttendance || []} />

      {/* 3-Column Equal Enterprise Grid: Pending Approvals, Recruitment Pipeline & Upcoming Celebrations */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <PendingTasks tasks={stats?.pendingTasks || []} />
        <RecruitmentPipelineCard pipeline={stats?.pipeline} />
        <CelebrationsCard
          upcomingBirthdays={stats?.upcomingBirthdays || []}
          workAnniversaries={stats?.workAnniversaries || []}
        />
      </div>
    </div>
  );
}
