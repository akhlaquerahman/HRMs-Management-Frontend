"use client";

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from 'react-i18next';

interface SalaryBreakdownAccordionProps {
  record: any;
}

export function SalaryBreakdownAccordion({ record }: SalaryBreakdownAccordionProps) {
  const { t } = useTranslation();
  if (!record) return null;

  return (
    <Accordion type="multiple" defaultValue={["earnings", "deductions"]} className="w-full">
      <AccordionItem value="earnings" className="border rounded-lg mb-4 px-4 bg-card">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex justify-between w-full pr-4">
            <span className="font-semibold text-emerald-700">{t("Earnings")}</span>
            <span className="font-bold">₹{record.grossSalary.toLocaleString()}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("Basic Salary")}</span>
              <span className="font-medium">₹{record.basicSalary.toLocaleString()}</span>
            </div>
            {record.hra > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("House Rent Allowance (HRA)")}</span>
                <span className="font-medium">₹{record.hra.toLocaleString()}</span>
              </div>
            )}
            {record.medicalAllowance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Medical Allowance")}</span>
                <span className="font-medium">₹{record.medicalAllowance.toLocaleString()}</span>
              </div>
            )}
            {record.travelAllowance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Travel Allowance")}</span>
                <span className="font-medium">₹{record.travelAllowance.toLocaleString()}</span>
              </div>
            )}
            {record.specialAllowance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Special Allowance")}</span>
                <span className="font-medium">₹{record.specialAllowance.toLocaleString()}</span>
              </div>
            )}
            {record.bonus > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Bonus")}</span>
                <span className="font-medium text-emerald-600">₹{record.bonus.toLocaleString()}</span>
              </div>
            )}
            {record.incentives > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Performance Incentive")}</span>
                <span className="font-medium text-emerald-600">₹{record.incentives.toLocaleString()}</span>
              </div>
            )}
            {record.reimbursements > 0 && (
              <div className="flex justify-between text-sm border-t pt-2 mt-2">
                <span className="text-muted-foreground">{t("Reimbursements (Non-Taxable)")}</span>
                <span className="font-medium">₹{record.reimbursements.toLocaleString()}</span>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="deductions" className="border rounded-lg px-4 bg-card">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex justify-between w-full pr-4">
            <span className="font-semibold text-rose-700">{t("Deductions")}</span>
            <span className="font-bold text-rose-600">-₹{record.deductions.toLocaleString()}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-4">
          <div className="space-y-3">
            {record.providentFund > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Provident Fund (PF)")}</span>
                <span className="font-medium text-rose-600">₹{record.providentFund.toLocaleString()}</span>
              </div>
            )}
            {record.esi > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("ESI")}</span>
                <span className="font-medium text-rose-600">₹{record.esi.toLocaleString()}</span>
              </div>
            )}
            {record.professionalTax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Professional Tax (PT)")}</span>
                <span className="font-medium text-rose-600">₹{record.professionalTax.toLocaleString()}</span>
              </div>
            )}
            {record.incomeTax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Income Tax (TDS)")}</span>
                <span className="font-medium text-rose-600">₹{record.incomeTax.toLocaleString()}</span>
              </div>
            )}
            {record.loanRecovery > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Loan Recovery")}</span>
                <span className="font-medium text-rose-600">₹{record.loanRecovery.toLocaleString()}</span>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
