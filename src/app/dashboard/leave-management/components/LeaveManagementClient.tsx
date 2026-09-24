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
import { LeaveFilterToolbar } from './LeaveFilterToolbar';
import { LeaveTable } from './LeaveTable';
import { RequestLeaveModal } from './RequestLeaveModal';
import { LeaveCalendar } from './LeaveCalendar';
import { AddHolidayModal } from './AddHolidayModal';
import { UpcomingHolidays } from '@/components/dashboard/UpcomingHolidays';
import { ManageLeaveQuotasModal } from './ManageLeaveQuotasModal';
import { Settings2 } from 'lucide-react';

export function LeaveManagementClient() {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  
  const isHR = user?.role === 'HR_MANAGER' || user?.role === 'SUPER_ADMIN' || user?.role === 'HR Admin' || user?.role === 'HR_ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuotasModalOpen, setIsQuotasModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);
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
      const res = await api.post('/leaves', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveTable'] });
      queryClient.invalidateQueries({ queryKey: ['leaveSummary'] });
      setIsModalOpen(false);
    }
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const res = await api.put(`/holidays/${data.id}`, data);
        return res.data;
      } else {
        const res = await api.post('/holidays', data);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });
      setIsHolidayModalOpen(false);
      setSelectedHoliday(null);
    }
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/holidays/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });
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
          <div className="flex items-center gap-3">
            {isHR && (
              <Button onClick={() => setIsQuotasModalOpen(true)} variant="outline" className="gap-2 bg-white dark:bg-slate-900 text-gray-700 border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <Settings2 className="w-4 h-4 text-gray-500 dark:text-slate-400" /> {t("Manage Quotas")}
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> {t("Request Leave")}
            </Button>
          </div>
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

        <div className="lg:col-span-3 flex flex-col gap-6">          
          {isHR ? (
            <LeaveCalendar 
              data={calendarData} 
              loading={isLoadingCalendar} 
              isHR={isHR} 
              onAddHoliday={() => { setSelectedHoliday(null); setIsHolidayModalOpen(true); }} 
              onEditHoliday={(holiday) => { setSelectedHoliday(holiday); setIsHolidayModalOpen(true); }}
              onDeleteHoliday={(id) => deleteHolidayMutation.mutate(id)}
            />
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
        isHR={isHR}
      />

      <AddHolidayModal
        isOpen={isHolidayModalOpen}
        onClose={() => { setIsHolidayModalOpen(false); setSelectedHoliday(null); }}
        onSubmit={(data) => addHolidayMutation.mutate(data)}
        isLoading={addHolidayMutation.isPending}
        initialData={selectedHoliday}
      />

      <ManageLeaveQuotasModal 
        isOpen={isQuotasModalOpen}
        onClose={() => setIsQuotasModalOpen(false)}
      />
    </div>
  );
}
