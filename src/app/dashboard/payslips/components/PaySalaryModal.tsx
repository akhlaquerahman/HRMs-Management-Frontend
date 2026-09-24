"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const paySalarySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  basicSalary: z.coerce.number().min(1, "Basic Salary is required"),
  bonus: z.coerce.number().optional().default(0),
  deductions: z.coerce.number().optional().default(0),
  workingDays: z.coerce.number().min(0).max(31, "Invalid working days"),
  paymentDate: z.string().min(1, "Payment date is required"),
  transactionId: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional()
});

type PaySalaryFormData = z.infer<typeof paySalarySchema>;

interface PaySalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaySalaryModal({ isOpen, onClose }: PaySalaryModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: employeesRes } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get("/employees")).data,
    enabled: isOpen
  });

  const employees = Array.isArray(employeesRes?.data) ? employeesRes.data : (employeesRes?.data?.data || []);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PaySalaryFormData>({
    resolver: zodResolver(paySalarySchema),
    defaultValues: {
      employeeId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      bonus: 0,
      deductions: 0,
      workingDays: 30,
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: "",
      bankName: "",
      accountNumber: ""
    }
  });

  const onSubmit = async (data: PaySalaryFormData) => {
    setIsSubmitting(true);
    try {
      await api.post("/payroll", { ...data, status: "PAID" });
      queryClient.invalidateQueries({ queryKey: ["payrollRecords"] });
      queryClient.invalidateQueries({ queryKey: ["payrollSummary"] });
      
      toast.success("Salary processed successfully. Payslip emailed to employee.");
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to process salary");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, onChange: (e: any) => void) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    onChange(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">{t("Process Salary Payment")}</DialogTitle>
          <DialogDescription>
            {t("Fill in the details below to process the salary. A PDF payslip will be generated and automatically emailed to the employee.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">{t("Employee")} *</label>
              <select 
                {...(() => {
                  const { onChange, ...rest } = register("employeeId");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                      const empId = e.target.value;
                      const selectedEmp = employees.find((emp: any) => emp.id === empId);
                      if (selectedEmp) {
                        setValue("bankName", selectedEmp.bankName || "");
                        setValue("accountNumber", selectedEmp.accountNumber || "");
                        setValue("basicSalary", selectedEmp.baseSalary || 0);
                      }
                      onChange(e);
                    }
                  }
                })()}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="" disabled>{t("Select Employee")}</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.email})</option>
                ))}
              </select>
              {errors.employeeId && <span className="text-xs text-red-500">{errors.employeeId.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Month (1-12)")} *</label>
              <Input type="number" min="1" max="12" {...register("month")} />
              {errors.month && <span className="text-xs text-red-500">{errors.month.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Year")} *</label>
              <Input type="number" min="2000" {...register("year")} />
              {errors.year && <span className="text-xs text-red-500">{errors.year.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Basic Salary (₹)")} *</label>
              <Input 
                {...(() => {
                  const { onChange, ...rest } = register("basicSalary");
                  return { ...rest, onChange: (e: any) => handleNumericInput(e, onChange) }
                })()} 
              />
              {errors.basicSalary && <span className="text-xs text-red-500">{errors.basicSalary.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Bonus (₹)")}</label>
              <Input 
                {...(() => {
                  const { onChange, ...rest } = register("bonus");
                  return { ...rest, onChange: (e: any) => handleNumericInput(e, onChange) }
                })()} 
              />
              {errors.bonus && <span className="text-xs text-red-500">{errors.bonus.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Deductions (₹)")}</label>
              <Input 
                {...(() => {
                  const { onChange, ...rest } = register("deductions");
                  return { ...rest, onChange: (e: any) => handleNumericInput(e, onChange) }
                })()} 
              />
              {errors.deductions && <span className="text-xs text-red-500">{errors.deductions.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Working Days")} *</label>
              <Input type="number" {...register("workingDays")} />
              {errors.workingDays && <span className="text-xs text-red-500">{errors.workingDays.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Payment Date")} *</label>
              <Input type="date" {...register("paymentDate")} />
              {errors.paymentDate && <span className="text-xs text-red-500">{errors.paymentDate.message}</span>}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">{t("Transaction ID")}</label>
              <Input placeholder="Bank Ref or TXN ID" {...register("transactionId")} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Bank Name")}</label>
              <Input placeholder="E.g. HDFC Bank" {...register("bankName")} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Account Number")}</label>
              <Input placeholder="Account No" {...register("accountNumber")} />
            </div>
          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>{t("Cancel")}</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Processing...")}
                </>
              ) : (
                t("Pay Salary & Send Slip")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
