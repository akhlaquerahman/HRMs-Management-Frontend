"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2 } from "lucide-react";
import { ManagerSearchSelect } from "./ManagerSearchSelect";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: boolean;
  managerId: string | null;
}

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentToEdit?: Department | null;
  employees: Employee[];
}

export function AddDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  departmentToEdit,
  employees,
}: AddDepartmentModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [managerId, setManagerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (departmentToEdit) {
      setName(departmentToEdit.name || "");
      setCode(departmentToEdit.code || "");
      setDescription(departmentToEdit.description || "");
      setStatus(departmentToEdit.status ?? true);
      setManagerId(
        departmentToEdit.managerId ||
          (departmentToEdit as any).manager?.id ||
          (departmentToEdit as any).resolvedManager?.id ||
          ""
      );
    } else {
      setName("");
      setCode("");
      setDescription("");
      setStatus(true);
      setManagerId("");
    }
    setError("");
  }, [departmentToEdit, isOpen]);

  // Auto-generate uppercase code if name changes and code is untouched
  const handleNameChange = (val: string) => {
    setName(val);
    if (!departmentToEdit && (!code || code === name.slice(0, 3).toUpperCase())) {
      setCode(val.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }
    if (!code.trim()) {
      setError("Department code is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        status,
        managerId: managerId || null,
      };

      if (departmentToEdit) {
        await api.put(`/departments/${departmentToEdit.id}`, payload);
      } else {
        await api.post("/departments", payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save department.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            {departmentToEdit ? "Edit Department" : "Create New Department"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Department Name *</Label>
              <Input
                id="dept-name"
                placeholder="e.g. Engineering"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept-code">Department Code *</Label>
              <Input
                id="dept-code"
                placeholder="e.g. ENG"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <ManagerSearchSelect
            employees={employees}
            value={managerId}
            onChange={(id) => setManagerId(id)}
            label="Department Manager"
            placeholder="Search manager by name, email or employee ID..."
          />

          <div className="space-y-2">
            <Label htmlFor="dept-desc">Description</Label>
            <Textarea
              id="dept-desc"
              placeholder="Brief summary of department responsibilities..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="dept-status"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
            />
            <Label htmlFor="dept-status" className="cursor-pointer text-sm font-medium">
              Active Status (Enable for company operations)
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {departmentToEdit ? "Update Department" : "Save Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
