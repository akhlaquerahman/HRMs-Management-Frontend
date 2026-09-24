"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import api from "@/lib/axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DesignationsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", level: 1, description: "", departmentId: "" });

  const { data: deptRes } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get("/departments")).data,
  });
  
  const departments = deptRes?.data || [];

  const { data: res, isLoading } = useQuery({
    queryKey: ["designations"],
    queryFn: async () => (await api.get("/designations")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (newDesig: any) => await api.post("/designations", newDesig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      setIsCreating(false);
      setFormData({ name: "", level: 1, description: "", departmentId: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/designations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["designations"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, level: Number(formData.level) });
  };

  const designations = res?.data || [];

  if (isLoading) return <div className="p-8 text-center">{t("Loading...")}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">{t("Designations")}</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("Add Designation")}
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="border p-4 rounded-md bg-card flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t("Designation Name")}</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Senior Developer" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("Department")}</label>
              <select 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.departmentId} 
                onChange={e => setFormData({...formData, departmentId: e.target.value})}
              >
                <option value="" disabled>Select Department</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>{t("Cancel")}</Button>
            <Button type="submit" disabled={createMutation.isPending}>{t("Save")}</Button>
          </div>
        </form>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Name")}</TableHead>
              <TableHead>{t("Department")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <EmptyState title="No Designations" description="No designations have been added yet." />
                </TableCell>
              </TableRow>
            ) : (
              designations.map((desig: any) => (
                <TableRow key={desig.id}>
                  <TableCell className="font-medium">{desig.name}</TableCell>
                  <TableCell>{desig.department?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => {
                      if(confirm('Are you sure you want to delete?')) deleteMutation.mutate(desig.id);
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
