"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface PayslipDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export function PayslipDrawer({ isOpen, onClose, record }: PayslipDrawerProps) {
  const { t } = useTranslation();

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalEarnings = (record.basicSalary || 0) + (record.hra || 0) + (record.bonus || 0) + (record.incentives || 0) + (record.reimbursements || 0) + (record.specialAllowance || 0) + (record.medicalAllowance || 0) + (record.travelAllowance || 0);

  const employee = record.employee;
  const companyName = record.companyName || record.company?.companyName || employee?.createdById?.companyName || employee?.companyName || 'Company';
  const companyAddress = record.companyAddress || record.company?.companyAddress || employee?.createdById?.companyAddress || employee?.companyAddress || '';
  const companyContact = record.companyContact || record.company?.companyContact || [record.company?.companyWebsite || employee?.createdById?.companyWebsite, record.company?.companyPhone || employee?.createdById?.companyPhone].filter(Boolean).join(' | ');
  const employeeName = record.employeeName || `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || 'Employee';
  const employeeId = employee?.employeeId || (record.employeeId && record.employeeId.startsWith('EMP') ? record.employeeId : '—');
  const employeeEmail = record.employeeEmail || employee?.email || '—';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50 rounded-xl sm:rounded-2xl">
        
        {/* Header Action Bar */}
        <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-sm sm:text-base font-bold text-gray-900 truncate">
              Payslip Detail — {record.month}/{record.year}
            </DialogTitle>
            <p className="text-[10px] sm:text-xs text-gray-500 font-mono">Ref: #{record.id?.slice(0, 8)}</p>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 pr-4 sm:pr-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="h-7 sm:h-8 text-xs px-2 sm:px-3 gap-1 border-gray-300"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            
            <Button 
              size="sm" 
              onClick={handlePrint}
              className="h-7 sm:h-8 text-xs px-2 sm:px-3 gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Document Container */}
        <div 
          className="p-3 sm:p-6 overflow-y-auto"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto'
          }}
        >
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm print:border-none print:shadow-none print:p-0 max-w-xl mx-auto">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 pb-3 border-b border-gray-200 gap-2">
              <div>
                <h1 className="text-base sm:text-xl font-bold text-blue-600 mb-0.5 tracking-tight">{companyName}</h1>
                {companyAddress && <p className="text-[11px] text-gray-500">{companyAddress}</p>}
                {companyContact && <p className="text-[11px] text-gray-500">{companyContact}</p>}
              </div>
              <div className="text-left sm:text-right">
                <h2 className="text-sm sm:text-lg font-bold text-gray-800 uppercase tracking-wide">PAYSLIP</h2>
                <p className="text-[11px] font-semibold text-gray-600">
                  For the Month of: {record.month}/{record.year}
                </p>
              </div>
            </div>

            {/* Summary Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Employee Summary */}
              <div className="bg-gray-50/70 p-2.5 rounded-md border border-gray-100">
                <h3 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 border-b border-gray-200 pb-1">Employee Summary</h3>
                <div className="grid grid-cols-[90px_1fr] gap-y-1 text-[11px]">
                  <span className="text-gray-500 font-medium">Employee Name:</span>
                  <span className="font-semibold text-gray-800">{employeeName}</span>
                  
                  <span className="text-gray-500 font-medium">Employee ID:</span>
                  <span className="text-gray-800 font-mono font-semibold">{employeeId}</span>
                  
                  <span className="text-gray-500 font-medium">Email:</span>
                  <span className="text-gray-800 truncate" title={employeeEmail}>{employeeEmail}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50/70 p-2.5 rounded-md border border-gray-100">
                <h3 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 border-b border-gray-200 pb-1">Payment Details</h3>
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px]">
                  <div>
                    <p className="text-gray-500 font-medium">Payment Date</p>
                    <p className="font-semibold text-gray-800">{format(new Date(record.paymentDate || new Date()), 'M/d/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Status</p>
                    <span className="inline-block font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] uppercase">
                      {record.status || 'PAID'}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Transaction ID</p>
                    <p className="font-semibold text-gray-800 font-mono text-[10px] truncate">{record.transactionId || '—'}</p>
                  </div>
                  <div>
                     <p className="text-gray-500 font-medium">Payment Mode</p>
                     <p className="font-semibold text-gray-800">{record.paymentMethod?.replace('_', ' ') || 'BANK TRANSFER'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 text-[11px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                {/* Earnings Column */}
                <div>
                  <div className="flex justify-between items-center bg-gray-100/80 px-2.5 py-1.5 border-b border-gray-200 font-bold text-gray-700">
                    <span>Earnings</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-semibold text-gray-900">₹{record.basicSalary?.toFixed(2)}</span>
                    </div>
                    {(record.hra > 0) && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">HRA</span>
                        <span className="font-semibold text-gray-900">₹{record.hra?.toFixed(2)}</span>
                      </div>
                    )}
                    {(record.bonus > 0 || record.incentives > 0) && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bonus / Allowance</span>
                        <span className="font-semibold text-gray-900">₹{((record.bonus || 0) + (record.incentives || 0) + (record.specialAllowance || 0)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center px-2.5 py-1.5 border-t border-gray-200 font-bold bg-gray-50 text-gray-800 mt-1">
                    <span>Total Earnings</span>
                    <span>₹{totalEarnings.toFixed(2)}</span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center bg-gray-100/80 px-2.5 py-1.5 border-b border-gray-200 font-bold text-gray-700">
                      <span>Deductions</span>
                      <span>Amount</span>
                    </div>
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tax / Deductions</span>
                        <span className="font-semibold text-red-600">-₹{record.deductions?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-2.5 py-1.5 border-t border-gray-200 font-bold bg-gray-50 text-gray-800">
                    <span>Total Deductions</span>
                    <span className="text-red-600">-₹{record.deductions?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg px-3 py-2 flex justify-between items-center mb-3">
              <span className="text-gray-700 font-semibold text-xs">Net Payable Salary:</span>
              <span className="text-emerald-700 font-bold text-base sm:text-lg">₹{record.netSalary?.toFixed(2)}</span>
            </div>

            {/* Footer Notice */}
            <div className="text-center border-t border-gray-200 pt-2">
              <p className="text-[10px] text-gray-400">
                This is a computer-generated document. No signature is required.
              </p>
            </div>
            
          </div>
        </div>

        {/* Action Buttons (Fixed at Bottom) */}
        <div 
          className="flex justify-end gap-2.5 px-4 py-2.5 bg-gray-50 border-t border-gray-200 print:hidden"
          style={{ flexShrink: 0 }}
        >
          <Button variant="outline" onClick={onClose} className="px-4 py-1 h-8 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 text-xs">
            Close
          </Button>
          <Button onClick={handlePrint} className="px-4 py-1 h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm text-xs">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print / Save as PDF
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

