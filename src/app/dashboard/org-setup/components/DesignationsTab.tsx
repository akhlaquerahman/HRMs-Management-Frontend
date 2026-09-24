"use client";

import React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MoreHorizontal, Eye, Edit, Trash, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DesignationForm } from "./DesignationForm";

export function DesignationsTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [designationToEdit, setDesignationToEdit] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: res, isLoading } = useQuery({
    queryKey: ["orgDesignations"],
    queryFn: async () => (await api.get("/org-setup/designations")).data
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/org-setup/designations/${id}`),
    onSuccess: () => {
      toast.success("Designation deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["orgDesignations"] });
      queryClient.invalidateQueries({ queryKey: ["orgSetupSummary"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete designation");
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this designation? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const designations = res?.data || [];

  return (
    <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-800/30">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100">Designations Directory</h3>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm" onClick={() => { setDesignationToEdit(null); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2"/> Create Designation</Button>
        <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if(!open) setDesignationToEdit(null); }}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{designationToEdit ? "Edit Designation" : "Create New Designation"}</DialogTitle></DialogHeader>
            <DesignationForm onSuccess={() => { setModalOpen(false); setDesignationToEdit(null); }} initialData={designationToEdit} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-slate-800/80 border-b">
            <TableRow>
              <TableHead>Designation Title</TableHead>
              <TableHead>Job Level</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Headcount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1,2,3,4].map(i => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : designations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-slate-400">No designations found.</TableCell>
              </TableRow>
            ) : (
              designations.map((desig: any) => (
                <TableRow key={desig.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <TableCell className="font-semibold text-gray-900 dark:text-slate-100">{desig.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      Level {desig.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{desig.department?.name || "Unassigned"}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2"/> {desig._count?.employees || 0}
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
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setDesignationToEdit(desig); setModalOpen(true); }}><Edit className="w-4 h-4 mr-2" /> Edit Designation</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(desig.id)} className="text-red-600"><Trash className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
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
