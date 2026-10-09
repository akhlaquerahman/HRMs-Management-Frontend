"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { RolesKPICards } from './RolesKPICards';
import { RolesFilterToolbar } from './RolesFilterToolbar';
import { RolesTable } from './RolesTable';
import { PageAccessModal } from './PageAccessModal';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export function RolesManagementClient() {
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedAccessRole, setSelectedAccessRole] = useState<any>(null);

  const { data: rolesRes, isLoading: isLoadingRoles } = useQuery({ 
    queryKey: ["admin_roles"], 
    queryFn: async () => (await api.get("/admin/roles")).data 
  });
  
  const roles = rolesRes?.data || [];

  const filteredRoles = roles.filter((r: any) => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleOpenAccess = (role: any) => {
    setSelectedAccessRole(role);
    setIsAccessModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t("Roles")} 
        description={t("Canonical multi-tenant role definitions and access control policy.")}
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-300 dark:border-emerald-800 text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {t("4 Protected Canonical System Roles")}
            </Badge>
          </div>
        }
      />

      <RolesKPICards roles={roles} loading={isLoadingRoles} />

      <div className="grid grid-cols-1 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <RolesFilterToolbar 
            onSearch={setSearchTerm}
            onFilterChange={setTypeFilter}
            onReset={handleResetFilters}
          />
          
          <RolesTable 
            data={filteredRoles} 
            loading={isLoadingRoles} 
            onManageAccess={handleOpenAccess}
          />
        </div>
      </div>

      <PageAccessModal 
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        role={selectedAccessRole}
      />
    </div>
  );
}
