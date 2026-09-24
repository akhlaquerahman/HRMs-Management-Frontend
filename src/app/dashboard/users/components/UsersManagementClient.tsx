"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { UsersKPICards } from './UsersKPICards';
import { UsersFilterToolbar } from './UsersFilterToolbar';
import { UsersTable } from './UsersTable';
import { UserModal } from './UserModal';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function UsersManagementClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: usersRes, isLoading: isLoadingUsers } = useQuery({ 
    queryKey: ["admin_users"], 
    queryFn: async () => (await api.get("/admin/users")).data 
  });
  
  const { data: rolesRes } = useQuery({ 
    queryKey: ["admin_roles"], 
    queryFn: async () => (await api.get("/admin/roles")).data 
  });

  const users = usersRes?.data || [];
  const roles = rolesRes?.data || [];

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.roleId === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async (id: string) => {
    if (confirm(t("Are you sure you want to delete this user? This action cannot be undone."))) {
      try {
        await api.delete(`/admin/users/${id}`);
        queryClient.invalidateQueries({ queryKey: ["admin_users"] });
        toast.success(t("User deleted successfully"));
      } catch (err: any) { 
        toast.error(err?.response?.data?.message || t("Error deleting user"));
      }
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t("User Management")} 
        description={t("Manage system users, assign roles, and handle account details.")}
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
              <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-4 h-4 mr-2"><path d="M5 12h14"/><path d="M12 5v14"/></svg></span>
              {t("Add User")}
            </Button>
          </div>
        }
      />

      <UsersKPICards users={users} loading={isLoadingUsers} />

      <div className="grid grid-cols-1 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <UsersFilterToolbar 
            onSearch={setSearchTerm}
            onFilterChange={setRoleFilter}
            onReset={handleResetFilters}
            onCreateClick={handleCreateClick}
            roles={roles}
          />
          
          <UsersTable 
            data={filteredUsers} 
            loading={isLoadingUsers} 
            onEdit={handleEditClick}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        roles={roles}
      />
    </div>
  );
}
