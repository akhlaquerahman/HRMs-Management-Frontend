"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { AuditKPICards } from './AuditKPICards';
import { AuditFilterToolbar } from './AuditFilterToolbar';
import { AuditTable } from './AuditTable';

export function AuditLogsClient() {
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: resData, isLoading } = useQuery({ 
    queryKey: ["admin_audit_logs", page, limit], 
    queryFn: async () => {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
      return res.data;
    } 
  });
  
  const logs = resData?.data?.logs || [];
  const pagination = resData?.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Client-side filtering on current page items since the backend doesn't support search params on this route yet
  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user?.firstName && log.user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user?.email && log.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
    let matchesEntity = true;
    if (entityFilter !== 'ALL' && log.entityType !== entityFilter) matchesEntity = false;
    
    return matchesSearch && matchesEntity;
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setEntityFilter("ALL");
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t("System Audit Logs")} 
        description={t("Review a chronological list of actions performed across the system.")}
        showCreate={false}
        showSearch={false}
      />

      <AuditKPICards total={pagination.total} loading={isLoading} />

      <div className="grid grid-cols-1 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <AuditFilterToolbar 
            onSearch={setSearchTerm}
            onFilterChange={setEntityFilter}
            onReset={handleResetFilters}
          />
          
          <AuditTable 
            data={filteredLogs} 
            loading={isLoading}
            totalItems={pagination.total}
            currentPage={page}
            rowsPerPage={limit}
            onPageChange={setPage}
            onRowsPerPageChange={setLimit}
          />
        </div>
      </div>
    </div>
  );
}
