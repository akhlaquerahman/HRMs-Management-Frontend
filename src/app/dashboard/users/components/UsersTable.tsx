"use client";

import React, { useState } from 'react';
import { Users, MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from '@/lib/dateUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UsersTableProps {
  data: any[];
  loading?: boolean;
  onEdit: (user: any) => void;
  onDelete: (id: string) => void;
}

export function UsersTable({ data, loading, onEdit, onDelete }: UsersTableProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const handleBulkDelete = () => {
    const ids = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (ids.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${ids.length} selected users?`)) {
      ids.forEach(id => onDelete(id));
      setSelectedRows({});
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!data || !sortConfig) return data || [];
    return [...data].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'name') {
        valA = `${a.firstName} ${a.lastName}`.toLowerCase();
        valB = `${b.firstName} ${b.lastName}`.toLowerCase();
      }
      if (sortConfig.key === 'role') {
        valA = a.role?.name || "";
        valB = b.role?.name || "";
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-12">
        <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading users...</p>
        </div>
      </div>
    );
  }

  // Calculate pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const toggleSelectAll = (checked: boolean) => {
    const newSelected: Record<string, boolean> = {};
    if (checked) {
      paginatedData.forEach(u => newSelected[u.id] = true);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelect = (id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getRoleBadge = (roleName: string) => {
    if (!roleName) return null;
    const upper = roleName.toUpperCase();
    if (upper.includes('ADMIN')) {
      return <span className="font-semibold text-gray-900 dark:text-slate-100 block">{roleName}</span>;
    }
    return <span className="font-semibold text-gray-900 dark:text-slate-100 block">{roleName}</span>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Showing <span className="text-blue-600 font-bold">{data?.length || 0}</span> Users
        </h3>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold text-blue-700">{selectedCount} user(s) selected</span>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" className="h-8" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete Selected
            </Button>
          </div>
        </div>
      )}
      <div className="border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b-border/50 hover:bg-muted/50">
                <TableHead className="w-12 py-3 px-4">
                  <Checkbox 
                    checked={paginatedData.length > 0 && paginatedData.every(u => selectedRows[u.id])}
                    onCheckedChange={toggleSelectAll} 
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('id')}>
                  {t("User ID")} {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('name')}>
                  {t("User Details")} {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('role')}>
                  {t("Role & Company")} {sortConfig?.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('createdAt')}>
                  {t("Joined")} {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('status')}>
                  {t("Status")} {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 w-12 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    {t("No users found matching the filters.")}
                  </TableCell>
                </TableRow>
              ) : paginatedData.map((user) => (
                <React.Fragment key={user.id}>
                  <TableRow className={`border-b-border/50 hover:bg-muted/20 transition-colors ${expandedRows[user.id] ? 'bg-muted/10' : ''}`}>
                    <TableCell className="px-4">
                      <Checkbox checked={!!selectedRows[user.id]} onCheckedChange={() => toggleSelect(user.id)} />
                    </TableCell>
                    <TableCell className="px-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(user.id)}>
                        {expandedRows[user.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                        USR-{user.id.slice(0, 4).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-slate-100">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getRoleBadge(user.role?.name)}
                        <p className="text-xs text-muted-foreground">{user.companyName || "No Company"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap text-muted-foreground">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100/50 border-emerald-200">ACTIVE</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(user.id)} className="text-rose-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRows[user.id] && (
                    <TableRow className="bg-muted/5 border-b-border/50">
                      <TableCell colSpan={8} className="p-0">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contact</p>
                            <p className="text-sm font-medium">{user.companyPhone || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Address</p>
                            <p className="text-sm font-medium">{user.companyAddress || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Website</p>
                            <p className="text-sm font-medium">{user.companyWebsite || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Footer / Pagination matching EmployeeTable */}
      <div className="flex items-center justify-between text-sm text-muted-foreground p-4 bg-muted/10 border-t">
        <div className="flex items-center gap-2">
          <span>{t("Rows per page")}:</span>
          <Select value={rowsPerPage.toString()} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalItems)} {t("of")} {totalItems}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
