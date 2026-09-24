import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2 } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { nameValidation, employeeNameValidation, emailValidation, passwordValidation, empIdValidation, dateValidation } from '@/lib/validations/common.schema';

const employeeSchema = z.object({
  firstName: employeeNameValidation,
  lastName: employeeNameValidation,
  email: emailValidation,
  password: passwordValidation,
  employeeId: empIdValidation,
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  joiningDate: dateValidation,
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']),
  baseSalary: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function AddEmployeeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      employeeId: '',
      departmentId: '',
      designationId: '',
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: 'FULL_TIME',
      baseSalary: '',
    },
  });

  // Fetch meta data
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data
  });
  const { data: designations } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => (await api.get('/designations')).data.data
  });

  // Auto fill employee ID on open
  useEffect(() => {
    if (isOpen) {
      const randomId = `EMP-${Math.floor(Math.random() * 9000) + 1000}`;
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        employeeId: randomId,
        departmentId: '',
        designationId: '',
        joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'FULL_TIME',
        baseSalary: '',
      });
    }
  }, [isOpen, reset]);

  const createEmployee = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/employees', data);
    },
    onSuccess: () => {
      toast.success(t('Employee added successfully'));
      queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['workforceDashboard'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message);
    }
  });

  const onSubmitForm = (data: EmployeeFormData) => {
    const payload = {
      ...data,
      joiningDate: new Date(data.joiningDate).toISOString(),
      baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : 0,
    };
    createEmployee.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-3xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-y-auto rounded-xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("Add New Employee")}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t("Create a new employee profile and set up their login credentials.")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2 sm:py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold">{t("First Name")} *</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" required className="h-9 text-xs sm:text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-semibold">{t("Last Name")} *</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" required className="h-9 text-xs sm:text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">{t("Email Address")} *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john.doe@company.com" required className="h-9 text-xs sm:text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">{t("Temporary Password")} *</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required className="h-9 text-xs sm:text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId" className="text-xs font-semibold">{t("Employee ID")} *</Label>
              <Input id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="EMP-001" required className="h-9 text-xs sm:text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joiningDate" className="text-xs font-semibold">{t("Joining Date")} *</Label>
              <Input id="joiningDate" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} required className="h-9 text-xs sm:text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="baseSalary" className="text-xs font-semibold">{t("Base Salary (Annual CTC)")}</Label>
              <Input id="baseSalary" name="baseSalary" type="number" min="0" step="0.01" value={formData.baseSalary} onChange={handleChange} placeholder="e.g. 500000" className="h-9 text-xs sm:text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="departmentId" className="text-xs font-semibold">{t("Department")}</Label>
              <select 
                id="departmentId" name="departmentId" 
                value={formData.departmentId} onChange={handleChange}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm ring-offset-background"
              >
                <option value="">{t("Select Department")}</option>
                {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="designationId" className="text-xs font-semibold">{t("Role / Designation")}</Label>
              <select 
                id="designationId" name="designationId" 
                value={formData.designationId} onChange={handleChange}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm ring-offset-background"
              >
                <option value="">{t("Select Role")}</option>
                {designations?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employmentType" className="text-xs font-semibold">{t("Employment Type")} *</Label>
              <select 
                id="employmentType" name="employmentType" 
                value={formData.employmentType} onChange={handleChange}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm ring-offset-background"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4 flex flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={createEmployee.isPending} className="h-9 text-xs sm:text-sm px-4">{t("Cancel")}</Button>
            <Button type="submit" disabled={createEmployee.isPending} className="h-9 text-xs sm:text-sm px-4">
              {createEmployee.isPending ? t("Saving...") : t("Add Employee")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
