"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Building, Users, Briefcase, Plus, FileSpreadsheet, ListTree, UserCheck, MapPin, Search, Network, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { DepartmentsTab } from "./components/DepartmentsTab";
import { DesignationsTab } from "./components/DesignationsTab";
import { ReportingManagersTab } from "./components/ReportingManagersTab";
import { OrgChartTab } from "./components/OrgChartTab";

export default function OrganizationSetupPage() {
  const [activeTab, setActiveTab] = useState("departments");
  const { data: summaryRes, isLoading } = useQuery({
    queryKey: ["orgSetupSummary"],
    queryFn: async () => (await api.get("/org-setup/dashboard")).data
  });

  const summary = summaryRes?.data || {};

  const kpis = [
    { label: "Total Departments", value: summary.totalDepartments || 0, icon: Building, color: "text-blue-600", bg: "bg-blue-100", cardBg: "bg-blue-50/50" },
    { label: "Total Designations", value: summary.totalDesignations || 0, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-100", cardBg: "bg-indigo-50/50" },
    { label: "Active Employees", value: summary.activeEmployees || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100", cardBg: "bg-emerald-50/50" },
    { label: "Managers", value: summary.managers || 0, icon: UserCheck, color: "text-amber-600", bg: "bg-amber-100", cardBg: "bg-amber-50/50" },
  ];

  return (
    <div className="flex-1 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 flex items-center gap-2">
            Organization Setup
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1 max-w-2xl">
            Manage departments, designations, job roles, office locations, reporting hierarchy and organization structure.
          </p>
        </div>

      </div>

      {/* KPI Section */}
      {isLoading ? (
        <div className="w-full h-24 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading organization data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KPICard 
              key={i} 
              title={kpi.label} 
              value={kpi.value} 
              icon={kpi.icon}
              colorClass={kpi.color}
              bgClass={kpi.bg}
              cardBgClass={kpi.cardBg}
            />
          ))}
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 space-y-4 w-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 space-x-6 overflow-x-auto flex-nowrap pb-1">
              <TabsTrigger value="departments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm whitespace-nowrap">Departments</TabsTrigger>
              <TabsTrigger value="designations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm whitespace-nowrap">Designations</TabsTrigger>
              <TabsTrigger value="hierarchy" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm whitespace-nowrap">Reporting Managers</TabsTrigger>
              <TabsTrigger value="orgChart" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm whitespace-nowrap"><Network className="w-4 h-4 mr-2 inline" />Org Chart</TabsTrigger>
            </TabsList>

            <div className="mt-6 w-full">
              <TabsContent value="departments" className="mt-0 outline-none">
                <DepartmentsTab />
              </TabsContent>
              <TabsContent value="designations" className="mt-0 outline-none">
                <DesignationsTab />
              </TabsContent>
              <TabsContent value="hierarchy" className="mt-0 outline-none">
                <ReportingManagersTab />
              </TabsContent>
              <TabsContent value="orgChart" className="mt-0 outline-none">
                <OrgChartTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
