"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", roleId: "", companyName: "", companyWebsite: "", companyAddress: "", companyPhone: "" });

  const { data: usersRes } = useQuery({ queryKey: ["admin_users"], queryFn: async () => (await api.get("/admin/users")).data });
  const { data: rolesRes } = useQuery({ queryKey: ["admin_roles"], queryFn: async () => (await api.get("/admin/roles")).data });

  const users = usersRes?.data || [];
  const roles = rolesRes?.data || [];

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.roleId === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", formData);
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setIsCreating(false);
      setFormData({ firstName: "", lastName: "", email: "", password: "", roleId: "", companyName: "", companyWebsite: "", companyAddress: "", companyPhone: "" });
    } catch (err: any) { alert(err?.response?.data?.message || "Error"); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editUser.id}`, {
        firstName: editUser.firstName, lastName: editUser.lastName, email: editUser.email, roleId: editUser.roleId, companyName: editUser.companyName, companyWebsite: editUser.companyWebsite, companyAddress: editUser.companyAddress, companyPhone: editUser.companyPhone
      });
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setEditUser(null);
    } catch (err: any) { alert(err?.response?.data?.message || "Error"); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete user?")) {
      try {
        await api.delete(`/admin/users/${id}`);
        queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      } catch (err: any) { alert(err?.response?.data?.message || "Error"); }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Users" 
        description="Manage system users." 
        onSearch={setSearchTerm}
        actionButton={<Button onClick={() => setIsCreating(true)}><Plus className="mr-2 h-4 w-4" /> Add User</Button>} 
      />
      
      {isCreating && (
        <form onSubmit={handleCreate} className="border p-6 rounded-md bg-card shadow-sm mb-6 grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input required placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <Input required placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            <Input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <Input required type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})}>
              <option value="" disabled>Select Role</option>
              {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <Input placeholder="Company Name" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
            <Input placeholder="Company Website (Optional)" value={formData.companyWebsite} onChange={e => setFormData({...formData, companyWebsite: e.target.value})} />
            <Input placeholder="Company Address" value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})} />
            <Input placeholder="Company Phone" value={formData.companyPhone} onChange={e => setFormData({...formData, companyPhone: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      )}

      <div className="flex items-center gap-4">
        <select 
          className="h-10 rounded-md border bg-card px-3 py-2 text-sm shadow-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Company</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredUsers.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>{u.firstName} {u.lastName}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role?.name || "No Role"}</TableCell>
                <TableCell>{u.companyName || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditUser(u)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editUser && (
            <form onSubmit={handleEdit} className="grid gap-4">
              <Input placeholder="First Name" value={editUser.firstName} onChange={e => setEditUser({...editUser, firstName: e.target.value})} />
              <Input placeholder="Last Name" value={editUser.lastName} onChange={e => setEditUser({...editUser, lastName: e.target.value})} />
              <Input type="email" placeholder="Email" value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} />
              <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={editUser.roleId || ""} onChange={e => setEditUser({...editUser, roleId: e.target.value})}>
                <option value="" disabled>Select Role</option>
                {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <Input placeholder="Company Name" value={editUser.companyName || ""} onChange={e => setEditUser({...editUser, companyName: e.target.value})} />
              <Input placeholder="Company Website (Optional)" value={editUser.companyWebsite || ""} onChange={e => setEditUser({...editUser, companyWebsite: e.target.value})} />
              <Input placeholder="Company Address" value={editUser.companyAddress || ""} onChange={e => setEditUser({...editUser, companyAddress: e.target.value})} />
              <Input placeholder="Company Phone" value={editUser.companyPhone || ""} onChange={e => setEditUser({...editUser, companyPhone: e.target.value})} />
              <DialogFooter><Button type="submit">Save</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
