"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Table as TableIcon, LayoutGrid, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

interface AttendanceAnalyticsCardProps {
  attendanceHistory: any[];
  barChartData: any[];
}

export function AttendanceAnalyticsCard({ attendanceHistory, barChartData }: AttendanceAnalyticsCardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'SPLIT' | 'CHART' | 'TABLE'>('SPLIT');

  const formattedHistory = attendanceHistory || [];
  const chartData = barChartData || [];

  // Calculate average hours
  const totalHours = chartData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const avgHours = chartData.length > 0 ? (totalHours / chartData.length).toFixed(1) : "0.0";

  return (
    <div className="rounded-2xl border bg-card shadow-sm flex flex-col overflow-hidden transition-all">
      {/* Card Header with View Switcher */}
      <div className="p-5 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                {t("Working Hours")}
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                  Last 7 Days
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily timeline logs and weekly working trend summary (Avg: <span className="font-semibold text-foreground">{avgHours}h/day</span>)
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise View Toggle Buttons */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border shrink-0">
          <Button
            variant={activeTab === 'SPLIT' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('SPLIT')}
            className="h-8 text-xs font-medium rounded-lg px-3 hidden md:flex items-center gap-1.5"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Split View
          </Button>
          <Button
            variant={activeTab === 'CHART' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('CHART')}
            className="h-8 text-xs font-medium rounded-lg px-3 flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Trend Chart
          </Button>
          <Button
            variant={activeTab === 'TABLE' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('TABLE')}
            className="h-8 text-xs font-medium rounded-lg px-3 flex items-center gap-1.5"
          >
            <TableIcon className="w-3.5 h-3.5" />
            History Log
          </Button>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5">
        {/* VIEW 1: SPLIT VIEW (Side-by-Side inside 1 card) */}
        {activeTab === 'SPLIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Bar Chart */}
            <div className="lg:col-span-6 flex flex-col gap-3 border-b lg:border-b-0 lg:border-r pb-6 lg:pb-0 lg:pr-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Working Hours Trend
                </span>
                <span className="text-xs font-medium text-muted-foreground">Hours Worked / Day</span>
              </div>
              <div className="h-[220px] w-full mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      formatter={(val: any) => [`${val} hrs`, 'Working Hours']}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Table Log */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Attendance Log
                </span>
                <span className="text-xs text-muted-foreground font-medium">Last 7 Records</span>
              </div>
              
              <div className="overflow-x-auto rounded-xl border bg-background">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 uppercase font-medium text-muted-foreground border-b">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Hours</th>
                      <th className="px-3.5 py-2.5 text-center">Late</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formattedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3.5 py-6 text-center text-muted-foreground">
                          No attendance records available
                        </td>
                      </tr>
                    ) : (
                      formattedHistory.slice(0, 5).map((row: any, idx: number) => {
                        const h = Number(row.effectiveHours);
                        const hoursStr = isNaN(h) || h === 0 ? "0h" : `${h.toFixed(1)}h`;
                        const formattedDate = row.date ? format(new Date(row.date), 'MMM dd, yyyy') : '-';

                        return (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3.5 py-2.5 font-medium">{formattedDate}</td>
                            <td className="px-3.5 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                row.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                row.status === 'ABSENT' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-semibold text-foreground">{hoursStr}</td>
                            <td className="px-3.5 py-2.5 text-center">
                              {row.isLate ? (
                                <span className="text-rose-600 font-semibold">Yes</span>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FULL CHART VIEW */}
        {activeTab === 'CHART' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Daily Working Hours Analytics
              </span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                    formatter={(val: any) => [`${val} hrs`, 'Working Hours']}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 3: FULL TABLE VIEW */}
        {activeTab === 'TABLE' && (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 uppercase font-medium text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Hours Worked</th>
                    <th className="px-4 py-3 text-center">Late Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {formattedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    formattedHistory.map((row: any, idx: number) => {
                      const h = Number(row.effectiveHours);
                      const hoursStr = isNaN(h) || h === 0 ? "0h" : `${h.toFixed(1)}h`;
                      const formattedDate = row.date ? format(new Date(row.date), 'MMM dd, yyyy') : '-';

                      return (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{formattedDate}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              row.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                              row.status === 'ABSENT' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">{hoursStr}</td>
                          <td className="px-4 py-3 text-center">
                            {row.isLate ? (
                              <span className="text-rose-600 font-semibold">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
