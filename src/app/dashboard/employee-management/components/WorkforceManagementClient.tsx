"use client";

import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { UserPlus, UploadCloud, Download, FileBarChart, FileText, Plus } from 'lucide-react';

import { WorkforceKPICards } from './WorkforceKPICards';
import { AdvancedFilterToolbar } from './AdvancedFilterToolbar';
import { EmployeeTable } from './EmployeeTable';
import dynamic from 'next/dynamic';

const EmployeeProfileDrawer = dynamic(() => import('./EmployeeProfileDrawer').then(mod => mod.EmployeeProfileDrawer), { ssr: false });
const AddEmployeeModal = dynamic(() => import('./AddEmployeeModal').then(mod => mod.AddEmployeeModal), { ssr: false });
const EditEmployeeModal = dynamic(() => import('./EditEmployeeModal').then(mod => mod.EditEmployeeModal), { ssr: false });
const BulkImportEmployeeModal = dynamic(() => import('./BulkImportEmployeeModal').then(mod => mod.BulkImportEmployeeModal), { ssr: false });

export function WorkforceManagementClient() {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);

  const [filters, setFilters] = useState({ search: '', department: 'ALL', designation: 'ALL', status: 'ALL', employmentType: 'ALL' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['workforceDashboard'],
    queryFn: async () => (await api.get('/employees/dashboard')).data.data
  });

  const { data: employeesData, isLoading: isTableLoading } = useQuery({
    queryKey: ['workforceEmployees', filters, page, limit],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { ...filters, page, limit } });
      return res.data.data; // { data: [], total, page, totalPages }
    },
    placeholderData: keepPreviousData,
  });

  const handleFilterChange = (key: string, val: string) => {
    setFilters(p => ({ ...p, [key]: val }));
    setPage(1); // Reset to page 1 on filter change
  };
  const handleResetFilters = () => {
    setFilters({ search: '', department: 'ALL', designation: 'ALL', status: 'ALL', employmentType: 'ALL' });
    setPage(1);
  };

  const handleOpenProfile = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t("Employee Management")} 
        description={t("Manage your workforce, employee lifecycle, onboarding, departments and employment records.")}
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              title="Bulk Import"
              className="h-9 px-2.5 sm:px-3 text-xs font-medium gap-1.5 shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bulk Import</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              title="Export"
              className="h-9 px-2.5 sm:px-3 text-xs font-medium gap-1.5 border-emerald-300 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <Button
              size="sm"
              className="h-9 px-2.5 sm:px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground flex-1 sm:flex-initial whitespace-nowrap justify-center"
              onClick={() => setIsAddModalOpen(true)}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Employee</span>
            </Button>
          </div>
        }
      />

      <WorkforceKPICards data={dashboardData} loading={isDashboardLoading} />

      <AdvancedFilterToolbar filters={filters} onFilterChange={handleFilterChange} onReset={handleResetFilters} />

      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-9 space-y-6">
          <EmployeeTable 
            data={employeesData?.data || []} 
            loading={isTableLoading} 
            onOpenProfile={handleOpenProfile} 
            onEditEmployee={(emp: any) => {
              setEmployeeToEdit(emp);
              setIsEditModalOpen(true);
            }}
          />
          {employeesData?.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 p-4 border rounded-lg bg-white dark:bg-slate-900">
              <span className="text-sm text-muted-foreground">Showing {employeesData.data?.length} of {employeesData.total} employees</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <select 
                    className="border rounded p-1 text-sm bg-white dark:bg-slate-800 dark:border-slate-700 outline-none"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[20, 50, 100, 200, 500].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                  <Button variant="outline" disabled={page === employeesData.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedEmployeeId && (
        <EmployeeProfileDrawer
          employeeId={selectedEmployeeId}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setTimeout(() => setSelectedEmployeeId(null), 300);
          }}
        />
      )}

      <AddEmployeeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      {employeeToEdit && (
        <EditEmployeeModal 
          isOpen={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setTimeout(() => setEmployeeToEdit(null), 300);
          }} 
          employee={employeeToEdit} 
        />
      )}
      <BulkImportEmployeeModal isOpen={isBulkImportModalOpen} onClose={() => setIsBulkImportModalOpen(false)} />
    </div>
  );
}
