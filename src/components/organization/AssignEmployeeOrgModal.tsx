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
import { Label } from "@/components/ui/label";
import { Loader2, UserCheck, AlertCircle } from "lucide-react";
import { ManagerSearchSelect } from "./ManagerSearchSelect";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  departmentId?: string | null;
  designationId?: string | null;
  managerId?: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface Designation {
  id: string;
  name: string;
  code: string | null;
  departmentId: string;
}

interface AssignEmployeeOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  preselectedEmployee?: Employee | null;
}

export function AssignEmployeeOrgModal({
  isOpen,
  onClose,
  onSuccess,
  employees,
  departments,
  designations,
  preselectedEmployee,
}: AssignEmployeeOrgModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When employee or modal state changes, populate fields
  useEffect(() => {
    const emp = preselectedEmployee || employees.find((e) => e.id === selectedEmployeeId);
    if (emp) {
      setSelectedEmployeeId(emp.id);
      setDepartmentId(emp.departmentId || "");
      setDesignationId(emp.designationId || "");
      setManagerId(emp.managerId || "");
    } else {
      setSelectedEmployeeId("");
      setDepartmentId("");
      setDesignationId("");
      setManagerId("");
    }
    setError("");
  }, [preselectedEmployee, selectedEmployeeId, isOpen, employees]);

  // SMART CASCADING: Filter designations by selected departmentId
  const filteredDesignations = designations.filter(
    (des) => des.departmentId === departmentId
  );

  // Handle department change - reset designation if current designation does not belong to new department
  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    const validDesigs = designations.filter((des) => des.departmentId === newDeptId);
    if (!validDesigs.some((d) => d.id === designationId)) {
      setDesignationId(validDesigs.length > 0 ? validDesigs[0].id : "");
    }

    const targetDept = departments.find((d: any) => d.id === newDeptId) as any;
    if (targetDept?.managerId || targetDept?.manager?.id) {
      setManagerId(targetDept.managerId || targetDept.manager?.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError("Please select an employee.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.patch(`/employees/${selectedEmployeeId}/organization`, {
        departmentId: departmentId || null,
        designationId: designationId || null,
        managerId: managerId || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update employee organization structure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <UserCheck className="h-5 w-5 text-primary" />
            Assign Employee Organization
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assign-emp">Select Employee *</Label>
            <select
              id="assign-emp"
              className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-ring"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              disabled={!!preselectedEmployee}
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-dept">Department</Label>
            <select
              id="assign-dept"
              className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-ring"
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
            >
              <option value="">-- No Department --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.code ? `(${dept.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-desig" className="flex items-center justify-between">
              <span>Designation (Smart Cascading)</span>
              {departmentId && (
                <span className="text-xs text-muted-foreground font-normal">
                  Showing {filteredDesignations.length} designation(s) for this dept
                </span>
              )}
            </Label>
            <select
              id="assign-desig"
              className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-ring"
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              disabled={!departmentId}
            >
              <option value="">
                {!departmentId
                  ? "-- Select Department First --"
                  : filteredDesignations.length === 0
                  ? "-- No Designations in this Department --"
                  : "-- Choose Designation --"}
              </option>
              {filteredDesignations.map((des) => (
                <option key={des.id} value={des.id}>
                  {des.name} {des.code ? `(${des.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <ManagerSearchSelect
            employees={employees}
            value={managerId}
            onChange={(id) => setManagerId(id)}
            excludeEmployeeId={selectedEmployeeId}
            label="Reporting Manager"
            placeholder="Search manager by name, email or employee ID..."
          />

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign & Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
