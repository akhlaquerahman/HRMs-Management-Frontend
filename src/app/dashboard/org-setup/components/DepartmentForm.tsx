"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Department name schema strictly blocks numbers to meet user requirements
const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters").regex(/^[a-zA-Z\s\'-]+$/, "Name can only contain letters"),
  code: z.string().min(2, "Department code is required"),
  managerId: z.string().optional().nullable(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export function DepartmentForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: initialData || { name: "", code: "", managerId: "" }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch locations and employees for dropdowns
  const { data: employeesRes } = useQuery({ queryKey: ["activeEmployees", "all"], queryFn: async () => (await api.get("/employees?status=ACTIVE&limit=10000")).data });
  const employees = Array.isArray(employeesRes?.data) ? employeesRes.data : (employeesRes?.data?.data || []);

  // Auto-generate Department Code based on name
  const departmentName = watch("name");
  React.useEffect(() => {
    if (!initialData && departmentName && departmentName.length >= 2) {
      const code = departmentName.substring(0, 3).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);
      setValue("code", code);
    }
  }, [departmentName, setValue, initialData]);

  const onSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await api.put(`/org-setup/departments/${initialData.id}`, data);
        toast.success("Department updated successfully!");
      } else {
        await api.post("/org-setup/departments", data);
        toast.success("Department created successfully!");
      }
      queryClient.invalidateQueries({ queryKey: ["orgDepartments"] });
      queryClient.invalidateQueries({ queryKey: ["orgSetupSummary"] });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${initialData ? 'update' : 'create'} department`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Department Name <span className="text-red-500">*</span></Label>
          <Input 
            id="name" 
            placeholder="e.g. Engineering" 
            {...(() => {
              const { onChange, ...rest } = register("name");
              return {
                ...rest,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z\s\'-]/g, '');
                  onChange(e);
                }
              }
            })()} 
          />
          {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Department Code <span className="text-red-500">*</span></Label>
          <Input 
            id="code" 
            placeholder="e.g. ENG-001" 
            {...register("code")} 
          />
          {errors.code && <span className="text-xs text-red-500">{errors.code.message}</span>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Department Head (Optional)</Label>
        <Select defaultValue={initialData?.managerId || ""} onValueChange={(val) => setValue("managerId", val)}>
          <SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger>
          <SelectContent>
            {employees.length === 0 ? (
              <SelectItem value="none" disabled>No managers available</SelectItem>
            ) : (
              employees.map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>


      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {initialData ? "Updating..." : "Creating..."}
            </>
          ) : (
            initialData ? "Update Department" : "Create Department"
          )}
        </Button>
      </div>
    </form>
  );
}
