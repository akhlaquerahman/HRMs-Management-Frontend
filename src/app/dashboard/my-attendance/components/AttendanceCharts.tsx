"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';

const CHART_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export function AttendanceCharts({ chartsData, chartsLoading }: { chartsData: any, chartsLoading: boolean }) {
  if (chartsLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-2">
        <div className="h-[300px] bg-card rounded-xl border shadow-sm animate-pulse" />
        <div className="h-[300px] bg-card rounded-xl border shadow-sm animate-pulse" />
      </div>
    );
  }

  const { weeklyHours, monthlyAttendance } = chartsData || {};

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-2">
      {/* Weekly Hours Bar Chart */}
      <div className="bg-card rounded-xl border shadow-sm p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Weekly Hours Trend
          </h3>
          <span className="text-xs text-muted-foreground font-medium">Hours / Day</span>
        </div>
        <div className="h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyHours || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} formatter={(val: any) => [`${val} hrs`, 'Hours']} />
              <Bar dataKey="hours" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Attendance Pie Chart */}
      <div className="bg-card rounded-xl border shadow-sm p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-primary" />
            Monthly Attendance Distribution
          </h3>
          <span className="text-xs text-muted-foreground font-medium">This Month</span>
        </div>
        <div className="h-[230px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={monthlyAttendance || []}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {(monthlyAttendance || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
