"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Download, HelpCircle, FileSpreadsheet } from 'lucide-react';

import { PayrollKPICards } from './PayrollKPICards';
import { PayrollTable } from './PayrollTable';
import { PayrollFilterToolbar } from './PayrollFilterToolbar';
import { PayslipPdfViewer } from './PayslipPdfViewer';
import { PayrollAnalytics } from './PayrollAnalytics';
import { YTDSummaryWidget } from './YTDSummaryWidget';
import { PayrollTimelineWidget } from './PayrollTimelineWidget';
import { RaiseQueryModal } from './RaiseQueryModal';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { UpcomingHolidays } from '@/components/dashboard/UpcomingHolidays'; // Using existing widgets

export function PayrollManagementClient() {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const isHR = user?.role === 'HR_MANAGER' || user?.role === 'SUPER_ADMIN';

  const [filters, setFilters] = useState({ search: '', status: 'ALL', year: 'ALL', month: 'ALL' });
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  // Queries
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['payrollSummary'],
    queryFn: async () => (await api.get('/payroll/summary')).data.data
  });

  const { data: tableData, isLoading: isLoadingTable } = useQuery({
    queryKey: ['payrollRecords', filters],
    queryFn: async () => {
      const res = await api.get('/payroll', { params: filters });
      let results = res.data.data;
      if (filters.search) {
        results = results.filter((r: any) => 
          r.id.toLowerCase().includes(filters.search.toLowerCase()) || 
          r.employee?.firstName?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      return results;
    }
  });

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['payrollAnalytics'],
    queryFn: async () => (await api.get('/payroll/analytics')).data.data
  });

  const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['payrollTimeline'],
    queryFn: async () => (await api.get('/payroll/timeline')).data.data
  });

  const handleFilterChange = (key: string, val: string) => setFilters(p => ({ ...p, [key]: val }));
  const handleReset = () => setFilters({ search: '', status: 'ALL', year: 'ALL', month: 'ALL' });

  const handleExportCSV = () => {
    if (!tableData || tableData.length === 0) return;
    
    // Create CSV headers
    const headers = ['Payroll ID', 'Period (Month/Year)', 'Working Days', 'Paid Days', 'Gross Salary (INR)', 'Deductions (INR)', 'Net Salary (INR)', 'Status'];
    if (isHR) headers.splice(2, 0, 'Employee Name', 'Employee ID');

    // Create CSV rows
    const rows = tableData.map((r: any) => {
      const row = [
        r.id,
        `${r.month}/${r.year}`,
        r.workingDays,
        r.paidDays,
        r.grossSalary,
        r.deductions,
        r.netSalary,
        r.status
      ];
      if (isHR) {
        row.splice(2, 0, `${r.employee?.firstName} ${r.employee?.lastName}`, r.employee?.id);
      }
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payslips_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t("Payslips & Payroll")} 
        description={t("View, download and manage your salary history, payroll summaries and tax information.")}
        showCreate={false}
        showSearch={false}
      />

      <PayrollKPICards metrics={summaryData?.metrics} loading={isLoadingSummary} />

      <div className="grid grid-cols-1 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <PayrollFilterToolbar 
            onSearch={(v) => handleFilterChange('search', v)}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onExportCSV={handleExportCSV}
            showEmployeeFilter={isHR}
          />
          <PayrollTable 
            data={tableData} 
            loading={isLoadingTable} 
            isHR={isHR}
            onView={(r) => setSelectedRecord(r)} 
          />
          <PayrollAnalytics analytics={analyticsData} loading={isLoadingAnalytics} />
        </div>
      </div>

      <PayslipPdfViewer 
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
      
      <RaiseQueryModal 
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
      />
    </div>
  );
}
