"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, User, UserPlus, UserCheck, UserX, Loader2 } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';

interface UsersKPICardsProps {
  counts?: {
    totalUsers?: number;
    activeAdmins?: number;
    employees?: number;
    active?: number;
    inactive?: number;
    newUsers?: number;
  };
  loading?: boolean;
}

export function UsersKPICards({ counts, loading }: UsersKPICardsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl border bg-card/60 p-4 animate-pulse flex flex-col justify-between">
            <div className="h-4 w-1/2 bg-muted rounded"></div>
            <div className="h-6 w-1/3 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    { label: "Total Users", value: counts?.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" },
    { label: "Active Admins", value: counts?.activeAdmins ?? 0, icon: Shield, color: "text-purple-600", bg: "bg-purple-100", cardBg: "bg-purple-50/50" },
    { label: "Employees", value: counts?.employees ?? 0, icon: User, color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" },
    { label: "Active", value: counts?.active ?? 0, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" },
    { label: "Inactive", value: counts?.inactive ?? 0, icon: UserX, color: "text-rose-600", bg: "bg-rose-100", cardBg: "bg-rose-50/50" },
    { label: "New Users", value: counts?.newUsers ?? 0, icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-100", cardBg: "bg-indigo-50/50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi, i) => (
        <KPICard 
          key={i} 
          title={t(kpi.label)} 
          value={kpi.value} 
          icon={kpi.icon}
          colorClass={kpi.color}
          bgClass={kpi.bg}
          cardBgClass={kpi.cardBg}
        />
      ))}
    </div>
  );
}
