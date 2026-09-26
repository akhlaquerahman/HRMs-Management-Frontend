"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, Building, ShieldCheck, Activity, HardDrive, Database, 
  Server, Cpu, Zap, UserPlus, Shield, Settings, ArrowUpRight, CheckCircle2, Lock
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

export function SuperAdminDashboard({ stats }: { stats: any }) {
  const { t } = useTranslation();
  const router = useRouter();

  const userColumns = [
    { 
      header: t("User"), 
      accessor: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-primary/20">
            {row.firstName?.charAt(0) || row.email?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-semibold text-xs text-foreground truncate">{row.firstName} {row.lastName}</span>
            <span className="text-[10px] text-muted-foreground truncate">{row.email}</span>
          </div>
        </div>
      )
    },
    { 
      header: t("Role"), 
      accessor: (row: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
          {row.role?.name || 'USER'}
        </span>
      )
    },
    { 
      header: t("Joined"), 
      accessor: (row: any) => (
        <span className="text-xs text-muted-foreground">
          {row.createdAt ? format(new Date(row.createdAt), 'MMM dd, yyyy') : 'N/A'}
        </span>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Top KPI Summary Cards (6-Column Responsive Grid) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {stats?.metrics?.map((metric: any, i: number) => {
          let icon = Users;
          let color = "text-blue-600 dark:text-blue-400";
          let bg = "bg-blue-500/10";
          let cardBg = "bg-card";

          if (metric.title.includes('Organization') || metric.title.includes('Tenants')) { 
            icon = Building; color = "text-purple-600 dark:text-purple-400"; bg = "bg-purple-500/10"; 
          }
          if (metric.title.includes('Role') || metric.title.includes('Security')) { 
            icon = ShieldCheck; color = "text-rose-600 dark:text-rose-400"; bg = "bg-rose-500/10"; 
          }
          if (metric.title.includes('Storage')) { 
            icon = HardDrive; color = "text-amber-600 dark:text-amber-400"; bg = "bg-amber-500/10"; 
          }
          if (metric.title.includes('Logins') || metric.title.includes('Today')) { 
            icon = Activity; color = "text-emerald-600 dark:text-emerald-400"; bg = "bg-emerald-500/10"; 
          }

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

      {/* 2. Main Grid Layout (12 Columns) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* ================= LEFT SECTION (8 COLUMNS) ================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Infrastructure Health Status Panel */}
          <div className="rounded-2xl border bg-card shadow-xs p-5 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">{t("System Infrastructure Health")}</h3>
                  <p className="text-xs text-muted-foreground">{t("Real-time telemetry and database cluster metrics")}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("Operational")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Database Status */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">{t("Database Cluster")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground">{stats?.systemStatus?.database || 'HEALTHY'}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">12ms</span>
                  </div>
                </div>
              </div>

              {/* API Uptime */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">{t("API Gateway")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground">{stats?.systemStatus?.api || '99.9%'}</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{t("0 Errors")}</span>
                  </div>
                </div>
              </div>

              {/* Server CPU & Memory */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">{t("CPU & RAM Load")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground">{stats?.systemStatus?.cpu || '12'}%</span>
                    <span className="text-[10px] text-purple-600 font-semibold">4.2GB / 16GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Visualizations Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* System Roles Distribution */}
            <div className="rounded-2xl border bg-card shadow-xs p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md min-h-[320px]">
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">{t("Roles Distribution")}</h3>
                <p className="text-xs text-muted-foreground">{t("Active user breakdown across system roles")}</p>
              </div>

              <div className="w-full h-[220px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.pieChartData || [{ name: 'SUPER_ADMIN', value: 1 }]}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(stats?.pieChartData || [{ name: 'SUPER_ADMIN', value: 1 }]).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t text-xs">
                {(stats?.pieChartData || [{ name: 'SUPER_ADMIN', value: 1 }]).map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="font-semibold text-foreground">{entry.name}:</span>
                    <span>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* API Traffic Trend */}
            <div className="rounded-2xl border bg-card shadow-xs p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md min-h-[320px]">
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">{t("System Activity Trend")}</h3>
                <p className="text-xs text-muted-foreground">{t("API request volume over time")}</p>
              </div>

              <div className="w-full h-[220px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.barChartData || [
                    { name: 'Mon', value: 120 }, { name: 'Tue', value: 110 }, 
                    { name: 'Wed', value: 140 }, { name: 'Thu', value: 95 }, { name: 'Fri', value: 145 }
                  ]}>
                    <defs>
                      <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#trafficGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>{t("Peak Load: Wednesday")}</span>
                <span className="text-emerald-600 font-semibold">{t("+14% vs last week")}</span>
              </div>
            </div>

          </div>

          {/* Recent System Users Table (Single Clean Instance) */}
          <div className="h-[380px]">
            <DashboardDataTable 
              title={t("Recent System Users")} 
              data={stats?.recentUsers || []} 
              columns={userColumns}
              headerAction={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary hover:text-primary font-semibold flex items-center gap-1"
                  onClick={() => router.push('/dashboard/users')}
                >
                  {t("View All")} <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              }
            />
          </div>

        </div>

        {/* ================= RIGHT SECTION (4 COLUMNS) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Quick Admin Actions */}
          <div className="rounded-2xl border bg-card shadow-xs p-5 transition-all duration-200 hover:shadow-md">
            <h3 className="text-base font-bold text-foreground tracking-tight mb-4">{t("Quick Actions")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-semibold"
                onClick={() => router.push('/dashboard/users')}
              >
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>{t("Add User")}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-semibold"
                onClick={() => router.push('/dashboard/roles')}
              >
                <Shield className="w-5 h-5 text-purple-600" />
                <span>{t("Manage Roles")}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-semibold"
                onClick={() => router.push('/dashboard/audit-logs')}
              >
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>{t("Audit Logs")}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-semibold"
                onClick={() => router.push('/dashboard/org-setup')}
              >
                <Settings className="w-5 h-5 text-amber-600" />
                <span>{t("Settings")}</span>
              </Button>
            </div>
          </div>

          {/* Recent Audit Activity Feed */}
          <div className="rounded-2xl border bg-card shadow-xs p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground tracking-tight">{t("Audit Activity")}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-primary p-0 h-auto font-semibold"
                onClick={() => router.push('/dashboard/audit-logs')}
              >
                {t("View All")}
              </Button>
            </div>

            <div className="space-y-3.5 my-1 overflow-y-auto max-h-[300px] pr-1">
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.slice(0, 6).map((log: any, idx: number) => {
                  const actionName = log.action || 'USER_LOGIN';
                  const isLogin = actionName.includes('LOGIN');
                  
                  return (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isLogin ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {isLogin ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-foreground truncate">{actionName}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {log.timestamp ? format(new Date(log.timestamp), 'HH:mm') : ''}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : (log.ip || 'Super Admin')}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-muted-foreground text-center py-6">{t("No recent audit activities")}</div>
              )}
            </div>
          </div>

          {/* Security & System Info Widget */}
          <div className="rounded-2xl border bg-card shadow-xs p-5 bg-gradient-to-br from-card via-card to-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">{t("Security Status")}</h4>
                <p className="text-[11px] text-muted-foreground">{t("SSL Certificate active & encrypted")}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-3">
              <span>{t("Last Backup:")} <strong className="text-foreground">{t("Today, 04:00 AM")}</strong></span>
              <span className="text-emerald-600 font-semibold">{t("Protected")}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
