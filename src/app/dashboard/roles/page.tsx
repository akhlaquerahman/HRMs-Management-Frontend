"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { data: rolesRes } = useQuery({ queryKey: ["admin_roles"], queryFn: async () => (await api.get("/admin/roles")).data });
  const roles = rolesRes?.data || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/roles", formData);
      queryClient.invalidateQueries({ queryKey: ["admin_roles"] });
      setIsCreating(false);
      setFormData({ name: "", description: "" });
    } catch (err: any) { alert(err?.response?.data?.message || "Error"); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete role?")) {
      try {
        await api.delete(`/admin/roles/${id}`);
        queryClient.invalidateQueries({ queryKey: ["admin_roles"] });
      } catch (err: any) { alert(err?.response?.data?.message || "Error"); }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Roles" description="Manage user roles." actionButton={<Button onClick={() => setIsCreating(true)}><Plus className="mr-2 h-4 w-4" /> Add Role</Button>} />
      
      {isCreating && (
        <form onSubmit={handleCreate} className="border p-6 rounded-md bg-card shadow-sm mb-6 grid gap-4">
          <Input required placeholder="Role Name (e.g., HR_ADMIN)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <Input placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {roles.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-bold">{r.name}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
