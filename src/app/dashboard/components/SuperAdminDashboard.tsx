"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building, ShieldCheck, Activity, Settings, HardDrive, Database, Server, Clock, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable';
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function SuperAdminDashboard({ stats }: { stats: any }) {
  const { t } = useTranslation();

  const userColumns = [
    { header: "Name", accessor: (row: any) => `${row.firstName} ${row.lastName}` },
    { header: "Email", accessor: "email" },
    { header: "Role", accessor: (row: any) => row.role?.name || 'N/A' },
    { header: "Joined", accessor: (row: any) => format(new Date(row.createdAt), 'MMM dd, yyyy') },
  ];

  const logColumns = [
    { header: "Action", accessor: "action" },
    { header: "User", accessor: (row: any) => row.user ? `${row.user.firstName} ${row.user.lastName}` : 'System' },
    { header: "Time", accessor: (row: any) => format(new Date(row.timestamp), 'MMM dd, HH:mm') },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 6-Column KPI Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {stats?.metrics?.map((metric: any, i: number) => {
          let icon = Users;
          let color = "text-blue-600";
          let bg = "bg-blue-100";
          let cardBg = "bg-blue-50/50";
          
          if (metric.title.includes('Organization')) { icon = Building; color = "text-purple-600"; bg = "bg-purple-100"; cardBg = "bg-purple-50/50"; }
          if (metric.title.includes('Role') || metric.title.includes('Security')) { icon = ShieldCheck; color = "text-red-600"; bg = "bg-red-100"; cardBg = "bg-red-50/50"; }
          if (metric.title.includes('Storage')) { icon = HardDrive; color = "text-amber-600"; bg = "bg-amber-100"; cardBg = "bg-amber-50/50"; }
          if (metric.title.includes('Logins')) { icon = Activity; color = "text-emerald-600"; bg = "bg-emerald-100"; cardBg = "bg-emerald-50/50"; }

          return (
            <KPICard 
              key={i} 
              title={t(metric.title)} 
              value={metric.value} 
              trend={metric.trend}
              icon={icon}
              colorClass={color}
              bgClass={bg}
              cardBgClass={cardBg}
            />
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Left Column (Takes up 8 columns out of 12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="grid gap-6 md:grid-cols-2">            
            {/* System Infrastructure Health */}
            <div className="rounded-xl border bg-card shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                <Server className="w-5 h-5" />
                Infrastructure Health
              </h3>
              <div className="grid grid-cols-3 gap-4 h-full">
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/10">
                  <Database className={`w-8 h-8 mb-2 ${stats?.systemStatus?.database === 'HEALTHY' ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Database</span>
                  <span className="text-lg font-bold">{stats?.systemStatus?.database || 'OK'}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/10">
                  <Activity className="w-8 h-8 mb-2 text-blue-500" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">API Uptime</span>
                  <span className="text-lg font-bold">{stats?.systemStatus?.api || '99.9%'}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/10">
                  <Server className="w-8 h-8 mb-2 text-purple-500" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Server CPU</span>
                  <span className="text-lg font-bold">{stats?.systemStatus?.cpu || '12'}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 h-[400px]">
            <DashboardDataTable 
              title="Recent Users" 
              data={stats?.recentUsers || []} 
              columns={userColumns}
            />
            <DashboardDataTable 
              title="Audit Logs (Recent)" 
              data={stats?.recentLogs || []} 
              columns={logColumns}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 h-[350px]">
            <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-primary">System Roles Distribution</h3>
              <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ outline: 'none' }}>
                    <Pie
                      data={stats?.pieChartData}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {stats?.pieChartData?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-primary">API Traffic Trend</h3>
              <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.barChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Column (Takes up 4 columns out of 12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Subscription Overview */}
          <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-primary">Subscription Overview</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-3 bg-muted/20 border rounded-lg">
                <span className="text-sm font-medium">Current Plan</span>
                <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded">Enterprise</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/20 border rounded-lg">
                <span className="text-sm font-medium">Billing Cycle</span>
                <span className="text-sm font-bold text-muted-foreground">Annual</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/20 border rounded-lg">
                <span className="text-sm font-medium">Next Renewal</span>
                <span className="text-sm font-bold text-muted-foreground">Dec 31, 2026</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionCard 
                title="System Settings" 
                icon={Settings} 
                onClick={() => {}} 
              />
              <QuickActionCard 
                title="View Logs" 
                icon={HardDrive} 
                onClick={() => {}} 
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Critical Alerts & Logs</h3>
            <ActivityTimeline activities={stats?.recentActivities || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
