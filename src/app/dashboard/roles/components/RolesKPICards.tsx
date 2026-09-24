"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldAlert, ShieldCheck, Key, Loader2 } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';

interface RolesKPICardsProps {
  roles: any[];
  loading?: boolean;
}

export function RolesKPICards({ roles, loading }: RolesKPICardsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center gap-3 mb-6">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading role metrics...</p>
      </div>
    );
  }

  const totalRoles = roles.length;
  const coreRoles = roles.filter(r => ['SUPER_ADMIN', 'EMPLOYEE'].includes(r.name)).length;
  const customRoles = totalRoles - coreRoles;

  const kpis = [
    { label: "Total Roles", value: totalRoles, icon: Shield, color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" },
    { label: "Core System Roles", value: coreRoles, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" },
    { label: "Custom Roles", value: customRoles, icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" },
    { label: "Total Permissions", value: "Standard", icon: Key, color: "text-purple-600", bg: "bg-purple-100", cardBg: "bg-purple-50/50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
