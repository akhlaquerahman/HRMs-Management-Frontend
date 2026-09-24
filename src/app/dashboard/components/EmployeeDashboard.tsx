"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LogIn, CalendarCheck, Clock, FileText, CalendarDays, TrendingUp 
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { CompanyAnnouncements } from '@/components/dashboard/CompanyAnnouncements';
import { CelebrationsCard } from '@/components/dashboard/CelebrationsCard';
import { UpcomingHolidays } from '@/components/dashboard/UpcomingHolidays';
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable';
import { AttendanceAnalyticsCard } from '@/components/dashboard/AttendanceAnalyticsCard';

export function EmployeeDashboard({ stats }: { stats: any }) {
  const { t } = useTranslation();

  const payslipColumns = [
    { 
      header: "Month", 
      accessor: (row: any) => `${row.month}/${row.year}` 
    },
    { 
      header: "Net Salary", 
      accessor: (row: any) => (
        <span className="font-semibold text-foreground">
          ${row.netSalary?.toLocaleString() || 0}
        </span>
      )
    },
    { 
      header: "Status", 
      accessor: (row: any) => (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {row.status || 'PAID'}
        </span>
      )
    }
  ];

  const documentColumns = [
    { 
      header: "Document", 
      accessor: (row: any) => (
        <span className="font-medium text-foreground">{row.documentType || 'Document'}</span>
      )
    },
    { 
      header: "Status", 
      accessor: (row: any) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.verificationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
          row.verificationStatus === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {row.verificationStatus || 'PENDING'}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 6-Column KPI Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6">
        {stats?.metrics?.map((metric: any, i: number) => {
          let icon = CalendarCheck;
          let color = "text-blue-600";
          let bg = "bg-blue-100/80";
          let cardBg = "bg-card";
          
          if (metric.title.includes('Status')) { icon = LogIn; color = "text-emerald-600"; bg = "bg-emerald-100/80"; }
          if (metric.title.includes('Leave')) { icon = CalendarDays; color = "text-amber-600"; bg = "bg-amber-100/80"; }
          if (metric.title.includes('Holiday')) { icon = Clock; color = "text-purple-600"; bg = "bg-purple-100/80"; }
          if (metric.title.includes('%')) { icon = TrendingUp; color = "text-teal-600"; bg = "bg-teal-100/80"; }
          if (metric.title.includes('Hours')) { icon = Clock; color = "text-indigo-600"; bg = "bg-indigo-100/80"; }

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

      {/* Main Content Grid: 8 Cols Main Content + 4 Cols Sidebar */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Main Left Column (8 of 12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Unified Enterprise Card: Attendance History & Working Hours Trend */}
          <AttendanceAnalyticsCard 
            attendanceHistory={stats?.attendanceHistory || []}
            barChartData={stats?.barChartData || []}
          />

          {/* Assigned Documents & Payslips */}
          <div className="grid gap-6 md:grid-cols-2 min-h-[340px]">
            <DashboardDataTable 
              title="Assigned Documents" 
              data={stats?.assignedDocuments || []} 
              columns={documentColumns}
            />
            <DashboardDataTable 
              title="Recent Payslips" 
              data={stats?.recentPayslips || []} 
              columns={payslipColumns}
            />
          </div>

        </div>

        {/* Right Sidebar Column (4 of 12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Company Announcements */}
          <CompanyAnnouncements announcements={stats?.announcements || []} />
          
          {/* Celebrations Widget */}
          <CelebrationsCard
            upcomingBirthdays={stats?.upcomingBirthdays || []}
            workAnniversaries={stats?.workAnniversaries || []}
          />
          
          {/* Upcoming Holidays */}
          <UpcomingHolidays holidays={stats?.holidays || []} />

          {/* Recent Activities Feed */}
          <div className="rounded-xl border bg-card shadow-sm p-5">
            <h3 className="text-base font-semibold mb-4 text-foreground">Recent Activities</h3>
            <ActivityTimeline activities={stats?.recentActivities || []} />
          </div>

        </div>

      </div>
    </div>
  );
}
