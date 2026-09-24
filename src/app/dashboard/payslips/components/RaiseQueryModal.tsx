"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RaiseQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPayrollId?: string;
}

export function RaiseQueryModal({ isOpen, onClose, selectedPayrollId }: RaiseQueryModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [issueType, setIssueType] = useState('SALARY_DIFFERENCE');
  const [description, setDescription] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/payroll/query', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("Payroll query submitted successfully"));
      queryClient.invalidateQueries({ queryKey: ['payrollSummary'] });
      queryClient.invalidateQueries({ queryKey: ['payrollTimeline'] });
      onClose();
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("Failed to submit query"));
    }
  });

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error(t("Please describe your issue"));
      return;
    }
    submitMutation.mutate({ issueType, description, payrollId: selectedPayrollId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Raise Payroll Query")}</DialogTitle>
          <DialogDescription>
            {t("Submit a ticket to the finance and HR team if you found a discrepancy in your payslip.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>{t("Issue Type")}</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue placeholder={t("Select issue type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SALARY_DIFFERENCE">{t("Salary Difference")}</SelectItem>
                <SelectItem value="TAX_ISSUE">{t("Tax Deduction Issue")}</SelectItem>
                <SelectItem value="MISSING_BONUS">{t("Missing Bonus/Incentive")}</SelectItem>
                <SelectItem value="BANK_ISSUE">{t("Bank Account Issue")}</SelectItem>
                <SelectItem value="OTHER">{t("Other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t("Description")}</Label>
            <Textarea 
              placeholder={t("Please provide details about the discrepancy...")} 
              className="resize-none h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitMutation.isPending}>{t("Cancel")}</Button>
          <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? t("Submitting...") : t("Submit Query")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
