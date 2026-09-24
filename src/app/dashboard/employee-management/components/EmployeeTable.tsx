import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCircle, MoreVertical, ChevronDown, ChevronRight, Edit, Eye, Trash2, Shield, ChevronLeft, ChevronRight as ChevronRightIcon, UserPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeRowExpanded } from './EmployeeRowExpanded';
import { AssignManagerModal } from './AssignManagerModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

export function EmployeeTable({ data, loading, onOpenProfile }: { data: any[], loading: boolean, onOpenProfile: (id: string) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  
  // Modals
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [selectedEmpForManager, setSelectedEmpForManager] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const toggleExpand = (id: string) => setExpandedRows(p => ({ ...p, [id]: !p[id] }));
  const toggleSelect = (id: string) => setSelectedRows(p => ({ ...p, [id]: !p[id] }));
  const toggleSelectAll = (checked: boolean) => {
    if (checked && data) {
      const all = data.reduce((acc, curr) => ({ ...acc, [curr.id]: true }), {});
      setSelectedRows(all);
    } else {
      setSelectedRows({});
    }
  };

  const openAssignManager = (id: string) => {
    setSelectedEmpForManager([id]);
    setManagerModalOpen(true);
  };

  const deactivateEmployee = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return await api.put(`/employees/${id}`, { status });
    },
    onSuccess: (data, variables) => {
      const action = variables.status === 'INACTIVE' ? 'deactivated' : 'activated';
      toast.success(t(`Employee ${action} successfully`));
      queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['workforceDashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message);
    }
  });

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const isDeactivating = currentStatus === 'ACTIVE';
    if (confirm(t(isDeactivating ? "Are you sure you want to deactivate this account?" : "Activate this account?"))) {
      deactivateEmployee.mutate({ id, status: isDeactivating ? 'INACTIVE' : 'ACTIVE' });
    }
  };

  if (loading) {
    return (
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b-border/50 hover:bg-muted/50">
              <TableHead className="w-12 h-12"></TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="animate-pulse h-16 border-b-border/50">
                <TableCell><div className="w-4 h-4 rounded bg-muted"></div></TableCell>
                <TableCell><div className="flex gap-3 items-center"><div className="w-8 h-8 rounded-full bg-muted"></div><div className="h-4 w-32 bg-muted rounded"></div></div></TableCell>
                <TableCell><div className="h-4 w-24 bg-muted rounded"></div></TableCell>
                <TableCell><div className="h-6 w-16 bg-muted rounded-full"></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Calculate pagination
  const safeData = data || [];
  const totalItems = safeData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = safeData.slice(startIndex, startIndex + rowsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  return (
    <>
      <div className="border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b-border/50 hover:bg-muted/50">
                <TableHead className="w-12 py-3 px-4">
                  <Checkbox 
                    checked={paginatedData.length > 0 && paginatedData.every(emp => selectedRows[emp.id])}
                    onCheckedChange={toggleSelectAll} 
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap">{t("Employee ID")}</TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap">{t("Employee Details")}</TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap">{t("Role & Dept")}</TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap">{t("Manager")}</TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap">{t("Joined")}</TableHead>
                <TableHead className="py-3 font-semibold text-muted-foreground whitespace-nowrap">{t("Status")}</TableHead>
                <TableHead className="py-3 w-12 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    {t("No employees found matching the filters.")}
                  </TableCell>
                </TableRow>
              ) : paginatedData.map((emp) => (
                <React.Fragment key={emp.id}>
                  <TableRow className={`border-b-border/50 hover:bg-muted/20 transition-colors ${expandedRows[emp.id] ? 'bg-muted/10' : ''}`}>
                    <TableCell className="px-4">
                      <Checkbox checked={!!selectedRows[emp.id]} onCheckedChange={() => toggleSelect(emp.id)} />
                    </TableCell>
                    <TableCell className="px-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(emp.id)}>
                        {expandedRows[emp.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">{emp.employeeId}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm truncate">{emp.firstName} {emp.lastName}</span>
                          <span className="text-xs text-muted-foreground truncate">{emp.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm whitespace-nowrap">{emp.designation?.name || "—"}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{emp.department?.name || "—"}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">{emp.employmentType?.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {emp.department?.managerId === emp.id || (emp.department?.manager && (emp.department.manager.id === emp.id || emp.department.manager === emp.id)) ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            Dept Head
                          </span>
                        ) : emp.manager ? (
                          <>
                            <UserCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm whitespace-nowrap">{emp.manager.firstName} {emp.manager.lastName}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">{new Date(emp.joiningDate).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.status === 'ACTIVE' ? 'default' : emp.status === 'ON_LEAVE' ? 'secondary' : 'destructive'} 
                             className={emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                        {emp.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onOpenProfile(emp.id)}><Eye className="w-4 h-4 mr-2" /> {t("View Profile")}</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onOpenProfile(emp.id)}><Edit className="w-4 h-4 mr-2" /> {t("Edit Details")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => openAssignManager(emp.id)}><UserPlus className="w-4 h-4 mr-2" /> {t("Assign Manager")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {emp.status === 'ACTIVE' ? (
                            <DropdownMenuItem onSelect={() => handleToggleStatus(emp.id, emp.status)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" /> {t("Deactivate")}</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => handleToggleStatus(emp.id, emp.status)} className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"><UserPlus className="w-4 h-4 mr-2" /> {t("Activate")}</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRows[emp.id] && (
                    <TableRow className="bg-muted/5 border-b-border/50 hover:bg-muted/5">
                      <TableCell colSpan={9} className="p-0 border-b-0">
                        <EmployeeRowExpanded employee={emp} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/50 bg-muted/10 gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("Rows per page")}:</span>
              <Select 
                value={rowsPerPage.toString()} 
                onValueChange={(val) => { setRowsPerPage(Number(val)); setCurrentPage(1); }}
              >
                <SelectTrigger className="w-[70px] h-8 bg-background">
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
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalItems)} {t("of")} {totalItems}
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" size="icon" className="h-8 w-8" 
                  onClick={handlePrevPage} disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-8 w-8" 
                  onClick={handleNextPage} disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AssignManagerModal 
        isOpen={managerModalOpen} 
        onClose={() => setManagerModalOpen(false)} 
        employeeIds={selectedEmpForManager} 
      />
    </>
  );
}
