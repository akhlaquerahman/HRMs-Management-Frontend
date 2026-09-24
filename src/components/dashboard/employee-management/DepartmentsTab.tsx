"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import api from "@/lib/axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: boolean;
};

export function DepartmentsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });

  const { data: response, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newDept: any) => {
      await api.post("/departments", newDept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsCreating(false);
      setFormData({ name: "", code: "", description: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, status: true });
  };

  const departments: Department[] = response?.data || [];

  if (isLoading) {
    return <div className="p-8 text-center">{t("Loading...")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">{t("Departments")}</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("Add Department")}
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="border p-4 rounded-md bg-card flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t("Department Name")}</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Human Resources" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("Department Code")}</label>
              <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. HR" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t("Description")}</label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional description..." />
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
              <TableHead>{t("Code")}</TableHead>
              <TableHead>{t("Name")}</TableHead>
              <TableHead>{t("Description")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <EmptyState 
                    title="No Departments" 
                    description="No departments have been added yet."
                  />
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.code}</TableCell>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>{dept.description}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs \${dept.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {dept.status ? t("Active") : t("Inactive")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        if(confirm('Are you sure you want to delete this department?')) {
                          deleteMutation.mutate(dept.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
