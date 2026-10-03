"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { CalendarDays, Layers, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { ShiftTemplatesTab } from './components/ShiftTemplatesTab';
import { WeeklyRosterTab } from './components/WeeklyRosterTab';
import { RosterHistoryTab } from './components/RosterHistoryTab';

export default function ShiftManagementPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('weekly-roster');

  return (
    <div className="space-y-6">
      {/* STANDARD ENTERPRISE PAGE HEADER */}
      <PageHeader 
        title="Shift Management" 
        description="Plan weekly workforce shift rosters, manage shift templates, and track roster audit history."
        showSearch={false}
        showFilters={false}
        showCreate={false}
        showExport={false}
        showImport={false}
      />

      {/* NAVIGATION TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-xl border w-full sm:w-auto inline-flex gap-1">
          
          <TabsTrigger 
            value="weekly-roster" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs"
          >
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
            <span>Weekly Roster Planner</span>
          </TabsTrigger>

          <TabsTrigger 
            value="shift-templates" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Shift Templates & Profiles</span>
          </TabsTrigger>

          <TabsTrigger 
            value="roster-history" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs"
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>Roster History & Audit</span>
          </TabsTrigger>

        </TabsList>

        {/* TAB CONTENTS */}
        <TabsContent value="weekly-roster" className="m-0 focus-visible:outline-none">
          <WeeklyRosterTab />
        </TabsContent>

        <TabsContent value="shift-templates" className="m-0 focus-visible:outline-none">
          <ShiftTemplatesTab />
        </TabsContent>

        <TabsContent value="roster-history" className="m-0 focus-visible:outline-none">
          <RosterHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
