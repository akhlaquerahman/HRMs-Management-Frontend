"use client";

import React, { useState, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { UserPlus, UploadCloud, Download } from 'lucide-react';

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
  const [limit, setLimit] = useState(10);
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
      return res.data.data;
    },
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const handleFilterChange = useCallback((key: string, val: string) => {
    setFilters(p => ({ ...p, [key]: val }));
    setPage(1); // Reset to page 1 on filter change
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ search: '', department: 'ALL', designation: 'ALL', status: 'ALL', employmentType: 'ALL' });
    setPage(1);
  }, []);

  const handleOpenProfile = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsDrawerOpen(true);
  };

  const employeesList = Array.isArray(employeesData) 
    ? employeesData 
    : (Array.isArray(employeesData?.data) ? employeesData.data : []);

  const totalEmployees = employeesData?.total ?? employeesList.length;
  const totalPages = employeesData?.totalPages ?? Math.ceil(totalEmployees / limit) ?? 1;
  const startIdx = totalEmployees > 0 ? (page - 1) * limit + 1 : 0;
  const endIdx = Math.min(page * limit, totalEmployees);

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
              onClick={() => setIsBulkImportModalOpen(true)}
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

      <div className="w-full space-y-6">
        <EmployeeTable 
          data={employeesList} 
          loading={isTableLoading} 
          onOpenProfile={handleOpenProfile} 
          onEditEmployee={(emp: any) => {
            setEmployeeToEdit(emp);
            setIsEditModalOpen(true);
          }}
        />
        {totalEmployees > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 p-4 border rounded-xl bg-card shadow-sm">
            <span className="text-sm text-muted-foreground">
              {t("Showing")} <span className="font-semibold text-foreground">{startIdx}-{endIdx}</span> {t("of")} <span className="font-semibold text-foreground">{totalEmployees}</span> {t("employees")}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("Rows per page")}:</span>
                <select 
                  className="border rounded-md px-2 py-1 text-sm bg-background border-input outline-none cursor-pointer"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  {t("Previous")}
                </Button>
                <span className="text-xs text-muted-foreground font-medium px-1">
                  {page} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  {t("Next")}
                </Button>
              </div>
            </div>
          </div>
        )}
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
