import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

export function AddEmployeeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
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
  });

  // Fetch meta data
  const { data: rawDepartments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data?.data || res.data || [];
    }
  });
  const { data: rawDesignations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const res = await api.get('/designations');
      return res.data?.data || res.data || [];
    }
  });

  const departments = Array.isArray(rawDepartments) ? rawDepartments : (Array.isArray((rawDepartments as any)?.data) ? (rawDepartments as any).data : []);
  const designations = Array.isArray(rawDesignations) ? rawDesignations : (Array.isArray((rawDesignations as any)?.data) ? (rawDesignations as any).data : []);

  // Auto fill employee ID on open
  useEffect(() => {
    if (isOpen) {
      const randomId = `EMP-${Math.floor(Math.random() * 9000) + 1000}`;
      setFormData({
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
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'departmentId' ? { designationId: '' } : {})
    }));
  };

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
      const fieldErrors = error.response?.data?.data;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        const errorDetails = fieldErrors.map((f: any) => `${f.field}: ${f.message}`).join(', ');
        toast.error(`Validation error: ${errorDetails}`);
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      departmentId: formData.departmentId || undefined,
      designationId: formData.designationId || undefined,
      joiningDate: formData.joiningDate ? formData.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : 0,
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
                {designations
                  ?.filter((des: any) => !formData.departmentId || des.departmentId === formData.departmentId)
                  .map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
            <Button type="submit" disabled={createEmployee.isPending} className="h-9 text-xs sm:text-sm px-4 bg-blue-600 hover:bg-blue-700">
              {createEmployee.isPending ? t("Saving...") : t("Add Employee")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
