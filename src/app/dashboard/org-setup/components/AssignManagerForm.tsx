"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AssignManagerForm({ onSuccess, initialManagerId, initialDepartmentId }: { onSuccess: () => void, initialManagerId?: string, initialDepartmentId?: string }) {
  const queryClient = useQueryClient();
  const { handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      employeeId: initialManagerId || "",
      departmentId: initialDepartmentId || ""
    }
  });
  
  React.useEffect(() => {
    reset({
      employeeId: initialManagerId || "",
      departmentId: initialDepartmentId || ""
    });
  }, [initialManagerId, initialDepartmentId, reset]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDept = watch("departmentId");
  const selectedEmp = watch("employeeId");

  // Fetch departments and active employees
  const { data: deptRes, isLoading: deptLoading } = useQuery({ queryKey: ["orgDepartments"], queryFn: async () => (await api.get("/org-setup/departments")).data });
  const { data: empRes, isLoading: empLoading } = useQuery({ queryKey: ["activeEmployeesList", "all"], queryFn: async () => (await api.get("/employees?status=ACTIVE&limit=10000")).data });
  
  const departments = deptRes?.data || [];
  const employees = Array.isArray(empRes?.data) ? empRes.data : (empRes?.data?.data || []);

  const onSubmit = async (data: any) => {
    if (!data.departmentId || !data.employeeId) {
      toast.error("Please select both a department and an employee.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/org-setup/assign-manager", data);
      toast.success("Department Manager assigned successfully!");
      // Invalidate relevant queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ["activeEmployeesList"] });
      queryClient.invalidateQueries({ queryKey: ["orgDepartments"] });
      queryClient.invalidateQueries({ queryKey: ["orgSetupSummary"] });
      queryClient.invalidateQueries({ queryKey: ["orgManagers"] });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign manager");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (deptLoading || empLoading) {
    return <div className="space-y-4 pt-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label>Select Department <span className="text-red-500">*</span></Label>
        <Select value={selectedDept} onValueChange={(val) => setValue("departmentId", val)}>
          <SelectTrigger><SelectValue placeholder="Which department needs a manager?" /></SelectTrigger>
          <SelectContent>
            {departments.map((dept: any) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">All employees in this department will report to the selected manager.</p>
      </div>

      <div className="space-y-2">
        <Label>Select Employee to Promote <span className="text-red-500">*</span></Label>
        <Select value={selectedEmp} onValueChange={(val) => setValue("employeeId", val)} disabled={!selectedDept}>
          <SelectTrigger>
            <SelectValue placeholder={selectedDept ? "Choose an employee..." : "Select a department first"} />
          </SelectTrigger>
          <SelectContent>
            {employees
              .filter((emp: any) => emp.departmentId === selectedDept)
              .map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</SelectItem>
            ))}
            {employees.filter((emp: any) => emp.departmentId === selectedDept).length === 0 && (
              <div className="p-2 text-sm text-gray-500 dark:text-slate-400 text-center">No employees found in this department</div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning...
            </>
          ) : (
            "Assign Manager"
          )}
        </Button>
      </div>
    </form>
  );
}
