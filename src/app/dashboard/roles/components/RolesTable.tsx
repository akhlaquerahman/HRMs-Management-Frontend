"use client";

import React, { useState } from 'react';
import { MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
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

interface RolesTableProps {
  data: any[];
  loading?: boolean;
  onEdit: (role: any) => void;
  onDelete: (id: string) => void;
}

export function RolesTable({ data, loading, onEdit, onDelete }: RolesTableProps) {
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
    if (window.confirm(`Are you sure you want to delete ${ids.length} selected roles?`)) {
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
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      
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
          <p className="text-muted-foreground font-medium animate-pulse">Loading roles...</p>
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
      paginatedData.forEach(r => newSelected[r.id] = true);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelect = (id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Showing <span className="text-blue-600 font-bold">{data?.length || 0}</span> Roles
        </h3>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold text-blue-700">{selectedCount} role(s) selected</span>
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
                    checked={paginatedData.length > 0 && paginatedData.every(r => selectedRows[r.id])}
                    onCheckedChange={toggleSelectAll} 
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('name')}>
                  {t("Role Name")} {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('description')}>
                  {t("Description")} {sortConfig?.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('id')}>
                  {t("System ID")} {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap">
                  {t("System Core")}
                </TableHead>
                <TableHead className="py-3 w-12 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {t("No roles found matching the filters.")}
                  </TableCell>
                </TableRow>
              ) : paginatedData.map((role) => (
                <React.Fragment key={role.id}>
                  <TableRow className={`border-b-border/50 hover:bg-muted/20 transition-colors ${expandedRows[role.id] ? 'bg-muted/10' : ''}`}>
                    <TableCell className="px-4">
                      <Checkbox checked={!!selectedRows[role.id]} onCheckedChange={() => toggleSelect(role.id)} />
                    </TableCell>
                    <TableCell className="px-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(role.id)}>
                        {expandedRows[role.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-gray-900 dark:text-slate-100">{role.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{role.description || "No description provided."}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                        {role.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      {['SUPER_ADMIN', 'EMPLOYEE'].includes(role.name) ? (
                        <Badge className="bg-blue-100/50 text-blue-700 hover:bg-blue-100/50 border-blue-200">CORE</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">CUSTOM</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(role)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(role.id)} className="text-rose-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRows[role.id] && (
                    <TableRow className="bg-muted/5 border-b-border/50">
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Created At</p>
                            <p className="text-sm font-medium">{role.createdAt ? formatDate(role.createdAt) : 'System Default'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Permissions</p>
                            <p className="text-sm font-medium">Inherits from standard configuration</p>
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
