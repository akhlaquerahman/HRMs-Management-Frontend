"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface PayrollAnalyticsProps {
  analytics: any;
  loading?: boolean;
}

export function PayrollAnalytics({ analytics, loading }: PayrollAnalyticsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-6 h-[350px] animate-pulse flex flex-col justify-end">
          <div className="h-6 w-1/3 bg-muted rounded mb-auto" />
          <div className="flex items-end justify-between gap-2 h-48 mt-4">
            {[1,2,3,4,5,6,7].map(i => <div key={i} className="bg-muted rounded w-full h-[60%]" style={{ height: `${Math.random() * 80 + 20}%` }} />)}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 h-[350px] animate-pulse flex flex-col justify-end">
          <div className="h-6 w-1/3 bg-muted rounded mb-auto" />
          <div className="flex items-end justify-between gap-2 h-48 mt-4">
            {[1,2,3,4,5,6,7].map(i => <div key={i} className="bg-muted rounded w-full h-[60%]" style={{ height: `${Math.random() * 80 + 20}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  const { salaryTrend, deductionTrend } = analytics || { salaryTrend: [], deductionTrend: [] };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Salary Trend Area Chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-primary">{t("Salary Trend")}</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salaryTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value/1000}k`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, '']}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="grossSalary" name={t("Gross Salary")} stroke="#3b82f6" fillOpacity={1} fill="url(#colorGross)" />
              <Area type="monotone" dataKey="netSalary" name={t("Net Salary")} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deduction Breakdown Bar Chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-primary">{t("Tax & Deductions")}</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deductionTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value/1000}k`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, '']}
                cursor={{ fill: 'transparent' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="tax" name={t("Income Tax")} stackId="a" fill="#f43f5e" radius={[0, 0, 4, 4]} barSize={20} />
              <Bar dataKey="pf" name={t("PF & ESI")} stackId="a" fill="#f59e0b" />
              <Bar dataKey="other" name={t("Other")} stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
