"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, PieChart as PieIcon } from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from 'recharts';

interface DepartmentDistributionCardProps {
  data?: { name: string; value: number }[];
  isLoading?: boolean;
}

const COLORS = [
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#84cc16'  // Lime
];

export function DepartmentDistributionCard({ data = [], isLoading = false }: DepartmentDistributionCardProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col min-h-[350px] animate-pulse">
        <div className="h-5 w-44 bg-muted rounded mb-2" />
        <div className="h-3 w-56 bg-muted/60 rounded mb-6" />
        <div className="w-36 h-36 rounded-full bg-muted/40 mx-auto my-auto" />
      </div>
    );
  }

  const chartData = (data && data.length > 0) ? data : [
    { name: 'Customer Support', value: 14 },
    { name: 'DevOps', value: 14 },
    { name: 'Finance', value: 14 },
    { name: 'IT Support', value: 14 },
    { name: 'Marketing', value: 14 },
    { name: 'Mobile Dev', value: 14 },
    { name: 'Software Dev', value: 16 }
  ];

  const totalEmployees = chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      
      {/* Header Section */}
      <div className="flex items-start justify-between mb-2 border-b pb-3 shrink-0">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {t("Department Distribution")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("Workforce breakdown by department")}
          </p>
        </div>

        {totalEmployees > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-muted text-foreground rounded-lg border font-mono">
            {totalEmployees} Employees
          </span>
        )}
      </div>

      {/* Donut Chart with Center Summary */}
      <div className="relative w-full h-[180px] shrink-0 flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart style={{ outline: 'none' }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataItem = payload[0];
                  const percent = totalEmployees > 0 ? ((Number(dataItem.value) / totalEmployees) * 100).toFixed(1) : 0;
                  return (
                    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: dataItem.color || COLORS[0] }} 
                      />
                      <span className="font-semibold">{dataItem.name}:</span>
                      <span className="font-bold">{dataItem.value} ({percent}%)</span>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground font-medium">Depts</span>
          <span className="text-lg font-extrabold text-foreground leading-none">{chartData.length}</span>
        </div>
      </div>

      {/* Non-Overflowing Custom Legend Grid */}
      <div className="max-h-[110px] overflow-y-auto pr-1 mt-1 space-y-1 scrollbar-thin shrink-0 border-t pt-2.5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {chartData.map((item, idx) => {
            const percent = totalEmployees > 0 ? Math.round(((item.value || 0) / totalEmployees) * 100) : 0;
            const dotColor = COLORS[idx % COLORS.length];

            return (
              <div 
                key={idx}
                className="flex items-center justify-between p-1 rounded hover:bg-muted/40 transition-colors"
                title={`${item.name}: ${item.value} employees (${percent}%)`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: dotColor }} 
                  />
                  <span className="truncate font-medium text-foreground text-[11px] leading-tight">
                    {item.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0 bg-muted/60 px-1.5 py-0.5 rounded">
                  {percent}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
