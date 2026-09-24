"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MoreHorizontal, Briefcase, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AssignManagerForm } from "./AssignManagerForm";

export function ReportingManagersTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);
  // Fetch active employees who are managers
  const { data: res, isLoading } = useQuery({
    queryKey: ["orgManagers", "all"],
    queryFn: async () => (await api.get("/employees?status=ACTIVE&limit=10000")).data 
  });

  const employees = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
  const managersMap = new Map();
  
  employees.forEach((emp: any) => {
    if (emp.managerId) {
      if (!managersMap.has(emp.managerId)) {
        managersMap.set(emp.managerId, { count: 0 });
      }
      managersMap.get(emp.managerId).count += 1;
    }
  });

  const managers = employees.filter((emp: any) => managersMap.has(emp.id)).map((mgr: any) => ({
    ...mgr,
    subordinates: managersMap.get(mgr.id).count
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-800/30">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100">Department Managers</h3>
        <Button size="sm" onClick={() => { setEditingManager(null); setModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"><Plus className="w-4 h-4 mr-2"/> Assign Manager</Button>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingManager ? "Edit Department Assignment" : "Assign Department Manager"}</DialogTitle></DialogHeader>
            <AssignManagerForm 
              onSuccess={() => setModalOpen(false)} 
              initialManagerId={editingManager?.id}
              initialDepartmentId={editingManager?.departmentId}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-slate-800/80 border-b">
            <TableRow>
              <TableHead>Manager Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Direct Reports</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1,2,3].map(i => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : managers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-slate-400">No reporting managers found.</TableCell>
              </TableRow>
            ) : (
              managers.map((mgr: any) => (
                <TableRow key={mgr.id} className="hover:bg-amber-50/30 transition-colors">
                  <TableCell className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                      {mgr.firstName[0]}{mgr.lastName[0]}
                    </div>
                    {mgr.firstName} {mgr.lastName}
                  </TableCell>
                  <TableCell className="text-gray-600">{mgr.department?.name || "Unassigned"}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 mr-2"/> {mgr.designation?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-900 dark:text-slate-100 font-medium">
                      <Users className="w-4 h-4 mr-2 text-amber-600"/> {mgr.subordinates}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:text-slate-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => {
                          setEditingManager(mgr);
                          setModalOpen(true);
                        }}>
                          Edit Department Assignment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
