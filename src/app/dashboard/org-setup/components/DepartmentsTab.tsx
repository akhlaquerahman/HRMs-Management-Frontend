"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/dateUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, MoreHorizontal, ChevronDown, ChevronRight, Eye, Edit, Archive, Trash, Users, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DepartmentForm } from "./DepartmentForm";

export function DepartmentsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: res, isLoading } = useQuery({
    queryKey: ["orgDepartments"],
    queryFn: async () => (await api.get("/org-setup/departments")).data
  });

  const departments = res?.data || [];

  const filteredDepartments = React.useMemo(() => {
    let result = departments;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((d: any) => d.name.toLowerCase().includes(s) || d.code.toLowerCase().includes(s));
    }
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter((d: any) => d.status === isActive);
    }
    return result;
  }, [departments, search, statusFilter]);

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const all = filteredDepartments.reduce((acc: any, curr: any) => ({ ...acc, [curr.id]: true }), {});
      setSelectedRows(all);
    } else {
      setSelectedRows({});
    }
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/org-setup/departments/${id}`),
    onSuccess: () => {
      toast.success("Department deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["orgDepartments"] });
      queryClient.invalidateQueries({ queryKey: ["orgSetupSummary"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete department");
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (ids.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${ids.length} selected departments? This action cannot be undone.`)) {
      try {
        await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
        setSelectedRows({});
      } catch(e) {
        // toast error already handled by mutation
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Enterprise Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search departments..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:bg-white dark:bg-slate-900"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-gray-50 dark:bg-slate-800"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Reset</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2"/> Filter</Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export</Button>
        </div>
      </div>

      {/* Enterprise Table */}
      <div className="flex items-center justify-between mb-3 px-1 mt-2">
        <h3 className="text-sm font-semibold text-foreground">
          Showing <span className="text-blue-600 font-bold">{filteredDepartments.length}</span> Departments
        </h3>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-4 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold text-blue-700">{selectedCount} department(s) selected</span>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" className="h-8" onClick={handleBulkDelete}>
              <Trash className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-800/30">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">Departments Directory</h3>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={() => { setDepartmentToEdit(null); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2"/> Create Department</Button>
          <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if(!open) setDepartmentToEdit(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{departmentToEdit ? "Edit Department" : "Create New Department"}</DialogTitle></DialogHeader>
              <DepartmentForm onSuccess={() => { setModalOpen(false); setDepartmentToEdit(null); }} initialData={departmentToEdit} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-slate-800/80 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px] pl-4">
                  <Checkbox 
                    checked={filteredDepartments.length > 0 && filteredDepartments.every((d: any) => selectedRows[d.id])}
                    onCheckedChange={toggleSelectAll} 
                  />
                </TableHead>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                      <p className="text-muted-foreground font-medium animate-pulse">Loading departments...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDepartments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-slate-400">No departments found.</TableCell>
                </TableRow>
              ) : (
                filteredDepartments.map((dept: any) => (
                  <React.Fragment key={dept.id}>
                    <TableRow className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => toggleRow(dept.id)}>
                      <TableCell className="pl-4 pr-2" onClick={(e) => toggleSelect(dept.id, e)}>
                        <Checkbox checked={!!selectedRows[dept.id]} onCheckedChange={(c) => setSelectedRows(p => ({...p, [dept.id]: !!c}))} />
                      </TableCell>
                      <TableCell className="pr-0 cursor-pointer">
                        {expandedRow === dept.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-slate-100">{dept.code}</TableCell>
                      <TableCell className="font-semibold text-blue-700">{dept.name}</TableCell>
                      <TableCell>
                        {dept.manager ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                              {dept.manager.firstName[0]}{dept.manager.lastName[0]}
                            </div>
                            <span className="text-sm font-medium">{dept.manager.firstName} {dept.manager.lastName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700">
                          <Users className="w-3 h-3 mr-1 inline"/> {dept._count?.employees || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={dept.status ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
                          {dept.status ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setDepartmentToEdit(dept); setModalOpen(true); }}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(dept.id)} className="text-red-600"><Trash className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expandable Row Content */}
                    {expandedRow === dept.id && (
                      <TableRow className="bg-gray-50 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <TableCell colSpan={8} className="p-0 border-b">
                          <div className="p-6 ml-10 border-l-2 border-blue-200 my-2 bg-white dark:bg-slate-900 rounded-r-xl shadow-sm">
                            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Department Details</h4>
                            <p className="text-sm text-gray-600 mb-4">{dept.description || "No description provided for this department."}</p>
                            
                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 uppercase">Office Location</p>
                                <p className="text-sm font-semibold">{dept.location?.name || "Global Remote"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 uppercase">Created On</p>
                                <p className="text-sm font-semibold">{formatDate(dept.createdAt)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 uppercase">Current Projects</p>
                                <p className="text-sm font-semibold text-blue-600">3 Active</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Standard Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 dark:bg-slate-800">
          <p className="text-sm text-gray-500 dark:text-slate-400">Showing 1 to {departments.length} of {departments.length} entries</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-200">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
