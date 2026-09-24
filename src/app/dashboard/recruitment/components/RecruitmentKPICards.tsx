"use client";

import React from 'react';
import { Users, Briefcase, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  cardBgClass: string;
}

function KPICard({ title, value, trend, icon, colorClass, bgClass, cardBgClass }: KPICardProps) {
  return (
    <div className={`p-4 rounded-xl border ${cardBgClass} flex flex-col justify-between shadow-sm transition-all hover:shadow-md h-full`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        {trend && (
          <p className="text-xs text-muted-foreground font-medium">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

interface RecruitmentKPICardsProps {
  metrics?: any[];
  loading?: boolean;
}

export function RecruitmentKPICards({ metrics, loading }: RecruitmentKPICardsProps) {
  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading recruitment metrics...</p>
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5" />;
      case 'CheckCircle': return <CheckCircle className="w-5 h-5" />;
      case 'Clock': return <Clock className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getColorClasses = (title: string) => {
    if (title.includes('Selected')) {
      return { color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" };
    }
    if (title.includes('Pending')) {
      return { color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" };
    }
    if (title.includes('Active Roles')) {
      return { color: "text-purple-600", bg: "bg-purple-100", cardBg: "bg-purple-50/50" };
    }
    return { color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" };
  };

  return (
    <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
      {metrics?.map((metric: any, i: number) => {
        const { color, bg, cardBg } = getColorClasses(metric.title);
        return (
          <KPICard 
            key={i} 
            title={metric.title} 
            value={metric.value} 
            trend={metric.subtitle}
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
