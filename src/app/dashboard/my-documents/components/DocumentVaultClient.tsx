"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, Share2 } from 'lucide-react';

import { DocumentKPICards } from './DocumentKPICards';
import { DocumentCategoriesGrid } from './DocumentCategoriesGrid';
import { DocumentFilterToolbar } from './DocumentFilterToolbar';
import { DocumentTable } from './DocumentTable';
import { DocumentPreviewDrawer } from './DocumentPreviewDrawer';
import { UploadDocumentModal } from './UploadDocumentModal';
import { StorageCapacityWidget } from './StorageCapacityWidget';
import { ExpiryAlertsWidget } from './ExpiryAlertsWidget';
import { SecurityStatusCard } from './SecurityStatusCard';

export function DocumentVaultClient() {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const isHR = user?.role === 'HR_MANAGER' || user?.role === 'SUPER_ADMIN';

  const [filters, setFilters] = useState({ search: '', category: 'ALL', status: 'ALL', documentType: 'ALL' });
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);

  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['documentSummary'],
    queryFn: async () => (await api.get('/documents/summary')).data.data
  });

  const { data: tableData, isLoading: isLoadingTable } = useQuery({
    queryKey: ['documentRecords', filters],
    queryFn: async () => {
      const res = await api.get('/documents', { params: filters });
      return res.data.data;
    }
  });

  const handleFilterChange = (key: string, val: string) => setFilters(p => ({ ...p, [key]: val }));
  const handleReset = () => setFilters({ search: '', category: 'ALL', status: 'ALL', documentType: 'ALL' });

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t("My Documents")} 
        description={t("Securely manage, upload and access all your personal and employment documents.")}
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex gap-2">
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <UploadCloud className="w-4 h-4 mr-2" />
              {t("Upload Document")}
            </Button>
          </div>
        }
      />

      <DocumentKPICards metrics={summaryData?.metrics} loading={isLoadingSummary} />

      <div className="grid gap-6">
        <div className="xl:col-span-2 space-y-6">
          <DocumentFilterToolbar 
            onSearch={(v) => handleFilterChange('search', v)}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            showEmployeeFilter={isHR}
          />
          <DocumentTable 
            data={tableData} 
            loading={isLoadingTable} 
            onView={(record) => {
              setSelectedRecord(record);
              setIsPreviewDrawerOpen(true);
            }}
            isHR={isHR}
          />
        </div>
      </div>

      <UploadDocumentModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

      <DocumentPreviewDrawer
        isOpen={isPreviewDrawerOpen}
        onClose={() => setIsPreviewDrawerOpen(false)}
        record={selectedRecord}
        isHR={isHR}
      />
    </div>
  );
}
