"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

import { LeaveKPICards } from './LeaveKPICards';
import { LeaveBalanceCards } from './LeaveBalanceCards';
import { LeaveFilterToolbar } from './LeaveFilterToolbar';
import { LeaveTable } from './LeaveTable';
import { RequestLeaveModal } from './RequestLeaveModal';
import { LeaveCalendar } from './LeaveCalendar';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { UpcomingHolidays } from '@/components/dashboard/UpcomingHolidays';

export function LeaveManagementClient() {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  
  const isHR = user?.role === 'HR_MANAGER' || user?.role === 'SUPER_ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: 'ALL', leaveType: 'ALL', department: 'ALL' });

  // Fetch Summary (KPIs & Balances)
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['leaveSummary'],
    queryFn: async () => {
      const res = await api.get('/leaves/summary');
      return res.data.data;
    }
  });

  // Fetch Table Data
  const { data: tableData, isLoading: isLoadingTable } = useQuery({
    queryKey: ['leaveRequests', filters],
    queryFn: async () => {
      const endpoint = isHR ? '/leaves' : '/leaves/my';
      const res = await api.get(endpoint, {
        params: filters
      });
      let results = res.data.data;
      if (filters.search) {
        results = results.filter((r: any) => 
          r.id.toLowerCase().includes(filters.search.toLowerCase()) || 
          r.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          r.employee?.firstName?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      return results;
    }
  });

  // Fetch Calendar Data
  const { data: calendarData, isLoading: isLoadingCalendar } = useQuery({
    queryKey: ['leaveCalendar'],
    queryFn: async () => {
      const res = await api.get('/leaves/calendar');
      return res.data.data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = '/leaves/my'; 
      const res = await api.post(endpoint, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveSummary'] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      setIsModalOpen(false);
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: string }) => {
      const res = await api.put(`/leaves/${id}/status`, { status: action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveSummary'] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });
    }
  });

  const handleFilterChange = (key: string, val: string) => setFilters(p => ({ ...p, [key]: val }));
  const handleSearch = (val: string) => setFilters(p => ({ ...p, search: val }));
  const handleReset = () => setFilters({ search: '', status: 'ALL', leaveType: 'ALL', department: 'ALL' });

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pt-2 sm:pt-4 pb-10">
      <PageHeader 
        title={t("Leave Management")} 
        description={isHR ? t("Manage all employee leave requests and balances.") : t("Manage your leave requests and balances.")}
        actionButton={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {t("Request Leave")}
          </Button>
        }
        showSearch={false}
      />

      {/* SINGLE TOP KPI ROW ONLY */}
      <LeaveKPICards metrics={summaryData?.metrics} loading={isLoadingSummary} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!isHR && <LeaveBalanceCards balances={summaryData?.balances} loading={isLoadingSummary} />}

          <LeaveFilterToolbar 
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onExport={() => alert("Exporting...")}
            showEmployeeFilter={isHR}
          />

          <LeaveTable 
            data={tableData} 
            loading={isLoadingTable} 
            isHR={isHR}
            onApprove={(id) => statusMutation.mutate({ id, action: 'APPROVED' })}
            onReject={(id) => statusMutation.mutate({ id, action: 'REJECTED' })}
            onCancel={(id) => statusMutation.mutate({ id, action: 'CANCELLED' })}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">          
          {isHR ? (
            <LeaveCalendar data={calendarData} loading={isLoadingCalendar} />
          ) : (
            <UpcomingHolidays holidays={calendarData?.holidays || []} loading={isLoadingCalendar} />
          )}
        </div>
      </div>

      <RequestLeaveModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
