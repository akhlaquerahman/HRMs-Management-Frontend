"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { RolesKPICards } from './RolesKPICards';
import { RolesFilterToolbar } from './RolesFilterToolbar';
import { RolesTable } from './RolesTable';
import { RoleModal } from './RoleModal';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function RolesManagementClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const { data: rolesRes, isLoading: isLoadingRoles } = useQuery({ 
    queryKey: ["admin_roles"], 
    queryFn: async () => (await api.get("/admin/roles")).data 
  });
  
  const roles = rolesRes?.data || [];

  const filteredRoles = roles.filter((r: any) => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const isCore = ['SUPER_ADMIN', 'EMPLOYEE'].includes(r.name);
    
    let matchesType = true;
    if (typeFilter === 'CORE' && !isCore) matchesType = false;
    if (typeFilter === 'CUSTOM' && isCore) matchesType = false;
    
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (confirm(t("Are you sure you want to delete this role? This action cannot be undone."))) {
      try {
        await api.delete(`/admin/roles/${id}`);
        queryClient.invalidateQueries({ queryKey: ["admin_roles"] });
        toast.success(t("Role deleted successfully"));
      } catch (err: any) { 
        toast.error(err?.response?.data?.message || t("Error deleting role"));
      }
    }
  };

  const handleEditClick = (role: any) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t("Roles")} 
        description={t("Manage user roles.")}
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
              <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-4 h-4 mr-2"><path d="M5 12h14"/><path d="M12 5v14"/></svg></span>
              {t("Add Role")}
            </Button>
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
            onEdit={handleEditClick}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <RoleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={editingRole}
      />
    </div>
  );
}
