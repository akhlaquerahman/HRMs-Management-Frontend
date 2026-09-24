"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, User, UserPlus, UserCheck, UserX, Loader2 } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';

interface UsersKPICardsProps {
  users: any[];
  loading?: boolean;
}

export function UsersKPICards({ users, loading }: UsersKPICardsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center gap-3 mb-6">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading user metrics...</p>
      </div>
    );
  }

  const totalUsers = users.length;
  const admins = users.filter(u => u.role?.name?.includes('ADMIN') || u.role?.name?.includes('Admin')).length;
  const employees = totalUsers - admins;
  
  // Assuming "recently added" is users created in last 7 days.
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newUsers = users.filter(u => u.createdAt && new Date(u.createdAt) >= oneWeekAgo).length;

  const kpis = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" },
    { label: "Active Admins", value: admins, icon: Shield, color: "text-purple-600", bg: "bg-purple-100", cardBg: "bg-purple-50/50" },
    { label: "Employees", value: employees, icon: User, color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" },
    { label: "Active", value: totalUsers, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" },
    { label: "Inactive", value: 0, icon: UserX, color: "text-rose-600", bg: "bg-rose-100", cardBg: "bg-rose-50/50" },
    { label: "New Users", value: newUsers, icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-100", cardBg: "bg-indigo-50/50" },
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
