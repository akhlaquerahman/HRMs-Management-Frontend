"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Plus, Loader2 } from 'lucide-react';

function UsersManagementContent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: rolesRes } = useQuery({ 
    queryKey: ["admin_roles"], 
    queryFn: async () => (await api.get("/admin/roles")).data 
  });
  const roles = rolesRes?.data || [];

  // Parse initial search params (e.g. ?role=HR_ADMIN or ?action=new)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const actionParam = searchParams.get('action');

    if (roleParam && roles.length > 0) {
      const matchedRole = roles.find((r: any) => 
        r.name.toUpperCase() === roleParam.toUpperCase() ||
        r.id === roleParam ||
        r.name.toUpperCase().includes(roleParam.toUpperCase())
      );
      if (matchedRole) {
        setRoleFilter(matchedRole.id);
      }
    }

    if (actionParam === 'new') {
      setIsModalOpen(true);
    }
  }, [searchParams, roles]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const { data: usersRes, isLoading: isLoadingUsers } = useQuery({ 
    queryKey: ["admin_users", { page, pageSize, search: debouncedSearch, role: roleFilter, status: statusFilter }], 
    queryFn: async () => {
      const res = await api.get("/admin/users", {
        params: {
          page,
          pageSize,
          search: debouncedSearch,
          roleId: roleFilter !== 'ALL' ? roleFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined
        }
      });
      return res.data;
    }
  });

  const responseData = usersRes?.data || {};
  const items = responseData.items || [];
  const pagination = responseData.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 1 };
  const counts = responseData.counts || {};

  useEffect(() => {
    if (pagination.totalPages > 0 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination.totalPages, page]);

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
    setDebouncedSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
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
            <Button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 shadow-sm font-medium">
              <Plus className="w-4 h-4 mr-2" />
              {t("Add User")}
            </Button>
          </div>
        }
      />

      <UsersKPICards counts={counts} loading={isLoadingUsers} />

      <div className="grid grid-cols-1 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <UsersFilterToolbar 
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            roleValue={roleFilter}
            onRoleChange={handleRoleFilterChange}
            statusValue={statusFilter}
            onStatusChange={handleStatusFilterChange}
            onReset={handleResetFilters}
            roles={roles}
          />
          
          <UsersTable 
            data={items} 
            pagination={pagination}
            loading={isLoadingUsers} 
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
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

export function UsersManagementClient() {
  return (
    <Suspense fallback={
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <UsersManagementContent />
    </Suspense>
  );
}
