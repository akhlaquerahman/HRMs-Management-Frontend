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
import { Loader2, Briefcase } from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface Designation {
  id: string;
  name: string;
  code: string | null;
  level: string;
  description: string | null;
  status: boolean;
  departmentId: string;
}

interface AddDesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  designationToEdit?: Designation | null;
  departments: Department[];
  defaultDepartmentId?: string;
}

export function AddDesignationModal({
  isOpen,
  onClose,
  onSuccess,
  designationToEdit,
  departments,
  defaultDepartmentId,
}: AddDesignationModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel] = useState("1");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (designationToEdit) {
      setName(designationToEdit.name || "");
      setCode(designationToEdit.code || "");
      setDepartmentId(designationToEdit.departmentId || "");
      setLevel(designationToEdit.level || "1");
      setDescription(designationToEdit.description || "");
      setStatus(designationToEdit.status ?? true);
    } else {
      setName("");
      setCode("");
      setDepartmentId(defaultDepartmentId || (departments.length > 0 ? departments[0].id : ""));
      setLevel("1");
      setDescription("");
      setStatus(true);
    }
    setError("");
  }, [designationToEdit, isOpen, defaultDepartmentId, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Designation title is required.");
      return;
    }
    if (!departmentId) {
      setError("Department selection is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        code: code.trim() ? code.trim().toUpperCase() : undefined,
        departmentId,
        level: level.trim() || "1",
        description: description.trim() || undefined,
        status,
      };

      if (designationToEdit) {
        await api.put(`/designations/${designationToEdit.id}`, payload);
      } else {
        await api.post("/designations", payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save designation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Briefcase className="h-5 w-5 text-primary" />
            {designationToEdit ? "Edit Designation" : "Create New Designation"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="desig-dept">Department *</Label>
            <select
              id="desig-dept"
              className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-ring"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.code ? `(${dept.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desig-name">Designation Title *</Label>
              <Input
                id="desig-name"
                placeholder="e.g. Senior Frontend Dev"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desig-code">Designation Code</Label>
              <Input
                id="desig-code"
                placeholder="e.g. ENG-SR-FE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desig-level">Seniority Level / Grade</Label>
            <select
              id="desig-level"
              className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-ring"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="1">Level 1 - Junior / Executive</option>
              <option value="2">Level 2 - Mid / Specialist</option>
              <option value="3">Level 3 - Senior / Lead</option>
              <option value="4">Level 4 - Manager / Principal</option>
              <option value="5">Level 5 - Director / VP / C-Level</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desig-desc">Description</Label>
            <Textarea
              id="desig-desc"
              placeholder="Role duties and requirements..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="desig-status"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
            />
            <Label htmlFor="desig-status" className="cursor-pointer text-sm font-medium">
              Active Designation
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {designationToEdit ? "Update Designation" : "Save Designation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
