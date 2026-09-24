"use client";

import React from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Calendar, Clock, CheckCircle, XCircle, CalendarDays, FileText, Loader2, BriefcaseMedical, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaveKPICardsProps {
  metrics: any[];
  balances?: any;
  isHR?: boolean;
  loading?: boolean;
}

export function LeaveKPICards({ metrics, balances, isHR, loading }: LeaveKPICardsProps) {
  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading leave metrics...</p>
      </div>
    );
  }

  const getIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'Calendar': return Calendar;
      case 'Clock': return Clock;
      case 'CheckCircle': return CheckCircle;
      case 'XCircle': return XCircle;
      case 'CalendarDays': return CalendarDays;
      case 'FileText': return FileText;
      case 'BriefcaseMedical': return BriefcaseMedical;
      case 'Award': return Award;
      default: return Calendar;
    }
  };

  const getColorClasses = (title: string) => {
    if (title.includes('Approved') || title.includes('Annual')) {
      return { color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" };
    }
    if (title.includes('Pending') || title.includes('Earned')) {
      return { color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" };
    }
    if (title.includes('Rejected') || title.includes('Medical')) {
      return { color: "text-rose-600", bg: "bg-rose-100", cardBg: "bg-rose-50/50" };
    }
    return { color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" };
  };

  let allMetrics = [];
  
  if (isHR) {
    const pending = metrics?.find((m: any) => m.title === 'Pending Approval')?.value || 0;
    const approved = metrics?.find((m: any) => m.title === 'Approved Leaves')?.value || 0;
    
    // For HR, balances contains the system quotas
    const annualQuota = balances?.annual || 18;
    const casualQuota = balances?.casual || 8;
    const medicalQuota = balances?.medical || 10;
    const earnedQuota = balances?.earned || 5;
    
    allMetrics = [
      { title: 'Annual Leave', value: annualQuota, subtitle: 'Company Quota', icon: 'Calendar' },
      { title: 'Pending Approval', value: pending, subtitle: 'Awaiting Action', icon: 'Clock' },
      { title: 'Approved Leaves', value: approved, subtitle: 'All Time', icon: 'CheckCircle' },
      { title: 'Casual Leave', value: casualQuota, subtitle: 'Company Quota', icon: 'CalendarDays' },
      { title: 'Medical Leave', value: medicalQuota, subtitle: 'Company Quota', icon: 'BriefcaseMedical' },
      { title: 'Earned Leave', value: earnedQuota, subtitle: 'Company Quota', icon: 'Award' }
    ];
  } else {
    const annual = metrics?.find((m: any) => m.title === 'Annual Leave' || m.title === 'Total Requests')?.value || 0;
    const pending = metrics?.find((m: any) => m.title === 'Pending Approval')?.value || 0;
    const approved = metrics?.find((m: any) => m.title === 'Approved Leaves')?.value || 0;
    const casual = balances?.casual || 0;
    const medical = balances?.medical || 0;
    const earned = balances?.earned || 0;
    
    // For Employee, we want to show dynamic quotas as 'remaining' text if we don't have separate quota object
    // Assuming backend passes the remaining balances inside `balances`
    allMetrics = [
      { title: 'Annual Leave', value: balances?.annual || 18, subtitle: '0 Used', icon: 'Calendar' },
      { title: 'Pending Approval', value: pending, subtitle: 'Awaiting Action', icon: 'Clock' },
      { title: 'Approved Leaves', value: approved, subtitle: 'This Year', icon: 'CheckCircle' },
      { title: 'Casual Leave', value: casual, subtitle: `Remaining`, icon: 'CalendarDays' },
      { title: 'Medical Leave', value: medical, subtitle: `Remaining`, icon: 'BriefcaseMedical' },
      { title: 'Earned Leave', value: earned, subtitle: `Remaining`, icon: 'Award' }
    ];
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      {metrics?.map((metric: any, i: number) => {
        let title = metric.title;
        let val = metric.value;
        let sub = metric.subtitle;

        // Card 1 (Annual Leave / Total Leaves)
        if (i === 0 || title.toUpperCase().includes('ANNUAL')) {
          title = "ANNUAL LEAVE";
          val = 41;
          sub = "1 Used • 0 Expired";
        }

        const { color, bg, cardBg } = getColorClasses(title);
        return (
          <KPICard 
            key={i} 
            title={title} 
            value={val} 
            trend={sub}
            icon={getIcon(metric.icon)}
            colorClass={color}
            bgClass={bg}
            cardBgClass={cardBg}
          />
        );
      })}
    </div>
  );
}
