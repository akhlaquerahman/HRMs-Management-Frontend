"use client";

import React from "react";
import { Users, UserCheck, PlayCircle, Coffee, Clock, AlertTriangle, UserX, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AttendanceSummaryProps {
  summary: {
    totalEmployees: number;
    presentToday: number;
    insufficientHours: number;
    halfDay: number;
    absent: number;
    currentlyWorking: number;
    onBreak: number;
    completedShift: number;
  } | null;
  isLoading?: boolean;
}

export const AttendanceKpiCards: React.FC<AttendanceSummaryProps> = ({ summary, isLoading }) => {
  const cards = [
    {
      title: "TOTAL EMPLOYEES",
      value: summary?.totalEmployees ?? 0,
      icon: Users,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50"
    },
    {
      title: "PRESENT TODAY",
      value: summary?.presentToday ?? 0,
      icon: UserCheck,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50"
    },
    {
      title: "CURRENTLY WORKING",
      value: summary?.currentlyWorking ?? 0,
      icon: PlayCircle,
      color: "text-indigo-500 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50",
      indicator: true
    },
    {
      title: "ON BREAK",
      value: summary?.onBreak ?? 0,
      icon: Coffee,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50"
    },
    {
      title: "HALF DAY",
      value: summary?.halfDay ?? 0,
      icon: Clock,
      color: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50"
    },
    {
      title: "INSUFFICIENT HOURS",
      value: summary?.insufficientHours ?? 0,
      icon: AlertTriangle,
      color: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50"
    },
    {
      title: "ABSENT",
      value: summary?.absent ?? 0,
      icon: UserX,
      color: "text-gray-500 dark:text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800"
    },
    {
      title: "COMPLETED SHIFT",
      value: summary?.completedShift ?? 0,
      icon: CheckCircle2,
      color: "text-cyan-500 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900/50"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className={`border transition-all duration-200 hover:shadow-md ${card.bg}`}>
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase truncate">
                  {card.title}
                </span>
                <div className="relative">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                  {card.indicator && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {isLoading ? (
                    <span className="inline-block h-6 w-12 bg-muted animate-pulse rounded" />
                  ) : (
                    card.value.toLocaleString()
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
