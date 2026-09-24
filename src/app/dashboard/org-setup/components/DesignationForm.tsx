"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const designationSchema = z.object({
  name: z.string().min(2, "Title must be at least 2 characters").regex(/^[a-zA-Z\s\'-]+$/, "Title can only contain letters"),
  level: z.string().min(1, "Level is required"), // Store as string for input compatibility, parse later
  departmentId: z.string().optional().nullable(),
  description: z.string().optional(),
});

type DesignationFormData = z.infer<typeof designationSchema>;

export function DesignationForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DesignationFormData>({
    resolver: zodResolver(designationSchema),
    defaultValues: initialData ? { ...initialData, level: String(initialData.level || 1) } : { level: "1", name: "", description: "" }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch departments for dropdown
  const { data: deptsRes } = useQuery({ queryKey: ["orgDepartments"], queryFn: async () => (await api.get("/org-setup/departments")).data });
  const departments = deptsRes?.data || [];

  const onSubmit = async (data: DesignationFormData) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, level: parseInt(data.level, 10) };
      if (initialData) {
        await api.put(`/org-setup/designations/${initialData.id}`, payload);
        toast.success("Designation updated successfully!");
      } else {
        await api.post("/org-setup/designations", payload);
        toast.success("Designation created successfully!");
      }
      queryClient.invalidateQueries({ queryKey: ["orgDesignations"] });
      queryClient.invalidateQueries({ queryKey: ["orgSetupSummary"] });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${initialData ? 'update' : 'create'} designation`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Designation Title <span className="text-red-500">*</span></Label>
          <Input 
            id="name" 
            placeholder="e.g. Senior Software Engineer" 
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
          <Label htmlFor="level">Job Level (1-10) <span className="text-red-500">*</span></Label>
          <Input 
            id="level" 
            min="1" 
            max="10" 
            {...(() => {
              const { onChange, ...rest } = register("level");
              return {
                ...rest,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/[^\d]/g, '');
                  onChange(e);
                }
              }
            })()}
          />
          {errors.level && <span className="text-xs text-red-500">{errors.level.message}</span>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Department <span className="text-red-500">*</span></Label>
        <Select defaultValue={initialData?.departmentId || ""} onValueChange={(val) => setValue("departmentId", val)}>
          <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
          <SelectContent>
            {departments.map((dept: any) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Role Description (Optional)</Label>
        <Textarea id="description" placeholder="Brief description of the responsibilities..." {...register("description")} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {initialData ? "Updating..." : "Creating..."}
            </>
          ) : (
            initialData ? "Update Designation" : "Create Designation"
          )}
        </Button>
      </div>
    </form>
  );
}
