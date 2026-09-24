"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, CalendarDays, AlertCircle, Briefcase, Gift, Award } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { CompanyAnnouncements } from '@/components/dashboard/CompanyAnnouncements';
import { CelebrationsCard } from '@/components/dashboard/CelebrationsCard';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable';
import { RecruitmentPipelineCard } from '@/components/dashboard/RecruitmentPipelineCard';
import { DepartmentDistributionCard } from '@/components/dashboard/DepartmentDistributionCard';
import { format } from 'date-fns';

export function HRManagerDashboard({ stats }: { stats: any }) {
  const { t } = useTranslation();

  const deptColumns = [
    { header: "Department", accessor: "department" },
    { header: "Present", accessor: "present", className: "text-green-600 font-medium" },
    { header: "Absent", accessor: "absent", className: "text-red-600 font-medium" },
    { header: "On Leave", accessor: "onLeave", className: "text-orange-600 font-medium" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 6-Column KPI Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-6 xl:grid-cols-6">
        {stats?.metrics?.map((metric: any, i: number) => {
          let icon = Users;
          let color = "text-blue-600";
          let bg = "bg-blue-100";
          let cardBg = "bg-blue-50/50";
          
          if (metric.title.includes('Present')) { icon = UserCheck; color = "text-green-600"; bg = "bg-green-100"; cardBg = "bg-green-50/50"; }
          if (metric.title.includes('Leave')) { icon = CalendarDays; color = "text-orange-600"; bg = "bg-orange-100"; cardBg = "bg-orange-50/50"; }
          if (metric.title.includes('Pending')) { icon = AlertCircle; color = "text-red-600"; bg = "bg-red-100"; cardBg = "bg-red-50/50"; }
          if (metric.title.includes('Recruitment')) { icon = Briefcase; color = "text-purple-600"; bg = "bg-purple-100"; cardBg = "bg-purple-50/50"; }
          if (metric.title.includes('Rate')) { icon = UserCheck; color = "text-emerald-600"; bg = "bg-emerald-100"; cardBg = "bg-emerald-50/50"; }

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
            />
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Left Column (Takes up 8 columns out of 12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Top Row: Overflow-Free Department Distribution & Single Primary Recruitment Pipeline Card */}
          <div className="grid gap-6 md:grid-cols-2">
            <DepartmentDistributionCard data={stats?.pieChartData} />
            <DashboardDataTable 
              title="Department Attendance Summary" 
              data={stats?.deptAttendance || []} 
              columns={deptColumns}
            />
          </div>
          
          {/* Middle Row: Pending Tasks & Department Attendance Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            <PendingTasks tasks={stats?.pendingTasks || []} />
            <RecruitmentPipelineCard pipeline={stats?.pipeline} />
          </div>  

        </div>

        {/* Right Sidebar Column (Takes up 4 columns out of 12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <CompanyAnnouncements announcements={stats?.announcements || []} />

          {/* Celebrations Widget */}
          <CelebrationsCard
            upcomingBirthdays={stats?.upcomingBirthdays || []}
            workAnniversaries={stats?.workAnniversaries || []}
          />

          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
            <ActivityTimeline activities={stats?.recentActivities || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
