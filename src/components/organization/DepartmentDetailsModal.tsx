"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCheck, Briefcase, Users, ExternalLink, Calendar, Edit, UserPlus, Plus } from "lucide-react";
import { format } from "date-fns";

interface Designation {
  id: string;
  name: string;
  code?: string | null;
  level?: string;
  employeeCount: number;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: boolean;
  employeeCount: number;
  designationCount: number;
  createdAt?: string;
  updatedAt?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    name?: string;
    employeeId: string;
    email?: string;
    designation?: string | null;
  } | null;
  designations: Designation[];
}

interface DepartmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  onEditDepartment: (dept: Department) => void;
  onAssignManager: (dept: Department) => void;
  onAddDesignation: (deptId: string) => void;
  onOpenDirectory?: (deptId?: string | null) => void;
}

export function DepartmentDetailsModal({
  isOpen,
  onClose,
  department,
  onEditDepartment,
  onAssignManager,
  onAddDesignation,
  onOpenDirectory,
}: DepartmentDetailsModalProps) {
  const router = useRouter();

  if (!department) return null;

  const managerName = department.manager
    ? department.manager.name || `${department.manager.firstName} ${department.manager.lastName}`
    : null;

  const handleNavigateToEmployees = () => {
    onClose();
    if (onOpenDirectory) {
      onOpenDirectory(department.id);
    } else {
      router.push(`/dashboard/employee-management?department=${department.id}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-muted/30 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{department.name}</h2>
                  {department.code && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {department.code}
                    </Badge>
                  )}
                  {department.status ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                {department.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{department.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Assigned Employees</span>
                <span className="text-2xl font-bold mt-1 block">{department.employeeCount}</span>
              </div>
              <Users className="h-6 w-6 text-muted-foreground/50" />
            </div>

            <div className="p-4 rounded-lg border bg-card flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Designations</span>
                <span className="text-2xl font-bold mt-1 block">{department.designationCount}</span>
              </div>
              <Briefcase className="h-6 w-6 text-muted-foreground/50" />
            </div>
          </div>

          {/* Department Manager Info */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                Department Manager
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:text-primary/90"
                onClick={() => {
                  onClose();
                  onAssignManager(department);
                }}
              >
                {department.manager ? "Change Manager" : "Assign Manager"}
              </Button>
            </div>

            {department.manager ? (
              <div className="flex items-center gap-3 pt-1">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                  {department.manager.firstName?.charAt(0) || "M"}
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{managerName}</h4>
                  <p className="text-xs text-muted-foreground">
                    {department.manager.designation || "Department Manager"} • ID: {department.manager.employeeId}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic pt-1">No department manager currently assigned.</p>
            )}
          </div>

          {/* Designations Breakdown List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                Designations ({department.designations?.length || 0})
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  onClose();
                  onAddDesignation(department.id);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Designation
              </Button>
            </div>

            {(!department.designations || department.designations.length === 0) ? (
              <p className="text-xs text-muted-foreground italic p-3 border rounded-md bg-muted/20 text-center">
                No designations created for this department yet.
              </p>
            ) : (
              <div className="space-y-2">
                {department.designations.map((desig) => (
                  <div key={desig.id} className="p-3 border rounded-md bg-card flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span>{desig.name}</span>
                        {desig.code && (
                          <span className="text-xs font-mono text-muted-foreground">({desig.code})</span>
                        )}
                      </div>
                      {desig.level && (
                        <span className="text-xs text-muted-foreground mt-0.5 block">Grade Level {desig.level}</span>
                      )}
                    </div>
                    <Badge variant="secondary" className="font-medium text-xs">
                      {desig.employeeCount} employees
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta Dates */}
          {(department.createdAt || department.updatedAt) && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              {department.createdAt && (
                <span>Created: {format(new Date(department.createdAt), "dd MMM yyyy")}</span>
              )}
              {department.updatedAt && (
                <span>Updated: {format(new Date(department.updatedAt), "dd MMM yyyy")}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleNavigateToEmployees} className="gap-1.5 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            View Employees in Directory
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEditDepartment(department);
              }}
              className="gap-1.5 text-xs"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Department
            </Button>
            <Button size="sm" variant="secondary" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
