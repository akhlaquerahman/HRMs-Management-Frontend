"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface BulkPayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkPayModal({ isOpen, onClose }: BulkPayModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeesData, setEmployeesData] = useState<any[]>([]);

  const { data: employeesRes, isSuccess } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get("/employees")).data,
    enabled: isOpen
  });

  useEffect(() => {
    const rawEmployees = Array.isArray(employeesRes?.data) ? employeesRes.data : (employeesRes?.data?.data || []);
    if (isSuccess && rawEmployees.length > 0) {
      const initialized = rawEmployees.map((emp: any) => ({
        selected: false,
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        bankName: emp.bankName || '',
        accountNumber: emp.accountNumber || '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basicSalary: emp.baseSalary || 0,
        bonus: 0,
        deductions: 0,
        workingDays: 30,
        paymentDate: new Date().toISOString().split('T')[0],
        transactionId: ''
      }));
      setEmployeesData(initialized);
    }
  }, [isSuccess, employeesRes, isOpen]);

  const handleSelectAll = (checked: boolean) => {
    setEmployeesData(prev => prev.map(emp => ({ ...emp, selected: checked })));
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    setEmployeesData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  const handleSubmit = async () => {
    const selectedEmployees = employeesData.filter(emp => emp.selected);
    if (selectedEmployees.length === 0) {
      toast.error(t("Please select at least one employee."));
      return;
    }

    for (const emp of selectedEmployees) {
      if (!emp.basicSalary || emp.basicSalary <= 0) {
        toast.error(t(`Basic salary is required for ${emp.name}`));
        return;
      }
      if (!emp.workingDays || emp.workingDays <= 0) {
        toast.error(t(`Working days required for ${emp.name}`));
        return;
      }
      if (!emp.paymentDate) {
        toast.error(t(`Payment date required for ${emp.name}`));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = selectedEmployees.map(emp => ({
        employeeId: emp.employeeId,
        month: Number(emp.month),
        year: Number(emp.year),
        basicSalary: Number(emp.basicSalary),
        bonus: Number(emp.bonus || 0),
        deductions: Number(emp.deductions || 0),
        workingDays: Number(emp.workingDays),
        paymentDate: emp.paymentDate,
        transactionId: emp.transactionId,
        bankName: emp.bankName,
        accountNumber: emp.accountNumber,
        status: "PAID"
      }));

      await api.post("/payroll/bulk", { records: payload });
      queryClient.invalidateQueries({ queryKey: ["payrollRecords"] });
      queryClient.invalidateQueries({ queryKey: ["payrollSummary"] });
      
      toast.success(t("Bulk salary processed successfully. Payslips emailed."));
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("Failed to process bulk salary"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-4 border-b shrink-0 bg-background z-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">{t("Bulk Salary Payment")}</DialogTitle>
            <DialogDescription>
              {t("Select employees and fill in their payroll details. Click process to generate payslips and email them all at once.")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <div className="rounded-md border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300"
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        checked={employeesData.length > 0 && employeesData.every(emp => emp.selected)}
                      />
                    </th>
                    <th className="p-3 font-medium min-w-[200px]">{t("Employee")}</th>
                    <th className="p-3 font-medium min-w-[150px]">{t("Bank Details")}</th>
                    <th className="p-3 font-medium min-w-[80px]">{t("Month")}</th>
                    <th className="p-3 font-medium min-w-[80px]">{t("Year")}</th>
                    <th className="p-3 font-medium min-w-[120px]">{t("Basic Salary")}</th>
                    <th className="p-3 font-medium min-w-[120px]">{t("Bonus")}</th>
                    <th className="p-3 font-medium min-w-[120px]">{t("Deductions")}</th>
                    <th className="p-3 font-medium min-w-[100px]">{t("Work Days")}</th>
                    <th className="p-3 font-medium min-w-[150px]">{t("TXN ID")}</th>
                    <th className="p-3 font-medium min-w-[150px]">{t("Payment Date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {employeesData.map((emp, index) => (
                    <tr key={emp.employeeId} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300"
                          checked={emp.selected}
                          onChange={(e) => handleRowChange(index, 'selected', e.target.checked)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{emp.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{emp.email}</div>
                      </td>
                      <td className="p-2 space-y-1">
                        <Input 
                          type="text" placeholder="Bank Name" 
                          className="h-7 text-xs" 
                          value={emp.bankName}
                          onChange={(e) => handleRowChange(index, 'bankName', e.target.value)}
                        />
                        <Input 
                          type="text" placeholder="Account No." 
                          className="h-7 text-xs" 
                          value={emp.accountNumber}
                          onChange={(e) => handleRowChange(index, 'accountNumber', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" min="1" max="12" 
                          className="h-8 text-xs" 
                          value={emp.month}
                          onChange={(e) => handleRowChange(index, 'month', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" min="2000" 
                          className="h-8 text-xs" 
                          value={emp.year}
                          onChange={(e) => handleRowChange(index, 'year', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" min="0" 
                          className="h-8 text-xs" 
                          value={emp.basicSalary}
                          onChange={(e) => handleRowChange(index, 'basicSalary', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" min="0" 
                          className="h-8 text-xs" 
                          value={emp.bonus}
                          onChange={(e) => handleRowChange(index, 'bonus', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" min="0" 
                          className="h-8 text-xs" 
                          value={emp.deductions}
                          onChange={(e) => handleRowChange(index, 'deductions', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" min="1" max="31" 
                          className="h-8 text-xs" 
                          value={emp.workingDays}
                          onChange={(e) => handleRowChange(index, 'workingDays', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="text" placeholder="TXN-..." 
                          className="h-8 text-xs" 
                          value={emp.transactionId}
                          onChange={(e) => handleRowChange(index, 'transactionId', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="date" 
                          className="h-8 text-xs" 
                          value={emp.paymentDate}
                          onChange={(e) => handleRowChange(index, 'paymentDate', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                  {employeesData.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-muted-foreground">
                        {t("No employees found.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t shrink-0 bg-background z-10 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {t("Selected Employees")}: <span className="font-bold text-foreground">{employeesData.filter(e => e.selected).length}</span>
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>{t("Cancel")}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || employeesData.filter(e => e.selected).length === 0} className="min-w-[150px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Processing Bulk Pay...")}
                </>
              ) : (
                t("Process Bulk Payroll")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
