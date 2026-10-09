import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export function EditEmployeeModal({ isOpen, onClose, employee }: { isOpen: boolean, onClose: () => void, employee: any }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    departmentId: '',
    designationId: '',
    employmentType: 'FULL_TIME',
    baseSalary: '',
  });

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        employeeId: employee.employeeId || '',
        departmentId: employee.departmentId || '',
        designationId: employee.designationId || '',
        employmentType: employee.employmentType || 'FULL_TIME',
        baseSalary: employee.baseSalary || '',
      });
    }
  }, [employee, isOpen]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'departmentId' ? { designationId: '' } : {})
    }));
  };

  const updateEmployee = useMutation({
    mutationFn: async (data: any) => {
      const { employeeId, ...rest } = data;
      const payload = { 
        ...rest,
        departmentId: rest.departmentId || undefined,
        designationId: rest.designationId || undefined,
      };
      if (payload.baseSalary !== undefined && payload.baseSalary !== '') {
        payload.baseSalary = parseFloat(payload.baseSalary) || 0;
      }
      return await api.put(`/employees/${employee.id}`, payload);
    },
    onSuccess: () => {
      toast.success(t('Employee updated successfully'));
      queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDetails', employee.id] });
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
    updateEmployee.mutate(formData);
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-3xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-y-auto rounded-xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("Edit Employee")}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2 sm:py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold">{t("First Name")} *</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="h-9 text-xs sm:text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-semibold">{t("Last Name")} *</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="h-9 text-xs sm:text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">{t("Email Address")} *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="h-9 text-xs sm:text-sm" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="employeeId" className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="w-3 h-3 text-muted-foreground/70" />
                  {t("Employee ID")}
                </Label>
                <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded border border-border/50">
                  {t("Immutable")}
                </span>
              </div>
              <Input 
                id="employeeId" 
                name="employeeId" 
                value={formData.employeeId} 
                disabled 
                readOnly 
                className="h-9 text-xs sm:text-sm font-mono bg-muted/60 text-muted-foreground cursor-not-allowed border-muted-foreground/20 opacity-80" 
              />
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

          {/* Read-only Effective Reporting Manager Info */}
          {formData.departmentId && (
            <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">{t("Effective Reporting Manager:")}</span>
              <span className="font-bold text-foreground">
                {(() => {
                  const selDept = departments.find((d: any) => d.id === formData.departmentId);
                  if (!selDept) return t("None");
                  if (selDept.manager) {
                    const mName = selDept.manager.name || `${selDept.manager.firstName || ''} ${selDept.manager.lastName || ''}`.trim();
                    return mName || t("Unassigned (No Department Manager)");
                  }
                  return t("Unassigned (No Department Manager)");
                })()}
              </span>
            </div>
          )}

          <DialogFooter className="pt-4 flex flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateEmployee.isPending} className="h-9 text-xs sm:text-sm px-4">{t("Cancel")}</Button>
            <Button type="submit" disabled={updateEmployee.isPending} className="h-9 text-xs sm:text-sm px-4">
              {updateEmployee.isPending ? t("Saving...") : t("Save Changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
