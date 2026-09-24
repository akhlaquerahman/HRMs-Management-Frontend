"use client";

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, X, ZoomIn, ZoomOut, Maximize2, Minimize2, 
  Download, Printer, FileText, CheckCircle2, ShieldCheck, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PayslipPdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export function PayslipPdfViewer({ isOpen, onClose, record }: PayslipPdfViewerProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState<number>(100);
  const [fitMode, setFitMode] = useState<'CUSTOM' | 'FIT_PAGE' | 'FIT_WIDTH'>('CUSTOM');
  const viewportRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open and listen for ESC key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const totalEarnings = (record.basicSalary || 0) + 
                        (record.hra || 0) + 
                        (record.bonus || 0) + 
                        (record.incentives || 0) + 
                        (record.reimbursements || 0) + 
                        (record.specialAllowance || 0) + 
                        (record.medicalAllowance || 0) + 
                        (record.travelAllowance || 0);

  const getMonthName = (monthNum: number) => {
    try {
      const date = new Date(2026, monthNum - 1, 1);
      return format(date, 'MMMM');
    } catch (e) {
      return `Month ${monthNum}`;
    }
  };

  const monthName = getMonthName(record.month || 2);
  const yearName = record.year || 2026;
  const companyName = record.companyName || record.company?.companyName || record.employee?.createdById?.companyName || record.employee?.companyName || 'Company';
  const companyAddress = record.companyAddress || record.company?.companyAddress || record.employee?.createdById?.companyAddress || record.employee?.companyAddress || '';
  const companyContact = record.companyContact || record.company?.companyContact || [record.company?.companyWebsite || record.employee?.createdById?.companyWebsite, record.company?.companyPhone || record.employee?.createdById?.companyPhone].filter(Boolean).join(' | ');

  const employeeName = record.employeeName || (record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Employee');
  const employeeId = record.employee?.employeeId || (record.employeeId && record.employeeId.startsWith('EMP') ? record.employeeId : '—');
  const employeeEmail = record.employeeEmail || record.employee?.email || '—';
  const departmentName = record.departmentName || record.employee?.department?.name || '—';
  const designationName = record.designationName || record.employee?.designation?.name || '—';
  const joiningDate = record.joiningDate || (record.employee?.joiningDate ? format(new Date(record.employee.joiningDate), 'dd MMM yyyy') : '—');

  const fileName = `Payslip_${monthName}_${yearName}_${employeeName.replace(/\s+/g, '_')}.pdf`;
  const currentZoomStyle = { transform: `scale(${zoom / 100})`, transformOrigin: 'top center' };

  // Zoom Handler
  const handleZoomIn = () => {
    setFitMode('CUSTOM');
    setZoom(prev => Math.min(200, prev + 15));
  };

  const handleZoomOut = () => {
    setFitMode('CUSTOM');
    setZoom(prev => Math.max(50, prev - 15));
  };

  const handleFitPage = () => {
    setFitMode('FIT_PAGE');
    if (viewportRef.current) {
      const vHeight = viewportRef.current.clientHeight - 60; // Subtract padding
      // A4 Height is ~1123px at 96 DPI
      const calculatedZoom = Math.max(50, Math.min(150, Math.floor((vHeight / 1123) * 100)));
      setZoom(calculatedZoom);
    }
  };

  const handleFitWidth = () => {
    setFitMode('FIT_WIDTH');
    if (viewportRef.current) {
      const vWidth = viewportRef.current.clientWidth - 48; // Subtract padding
      // A4 Width is ~794px at 96 DPI
      const calculatedZoom = Math.max(50, Math.min(160, Math.floor((vWidth / 794) * 100)));
      setZoom(calculatedZoom);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="payslip-pdf-viewer-root fixed inset-0 z-[100] flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden print:bg-white print:text-slate-900 print:static print:z-auto print:inset-auto print:block">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all elements on the entire page */
          body * {
            visibility: hidden !important;
          }
          /* Show ONLY the payslip element and its contents */
          #printable-payslip, #printable-payslip * {
            visibility: visible !important;
          }
          /* Position #printable-payslip cleanly on paper */
          #printable-payslip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            z-index: 9999999 !important;
            transform: none !important;
          }
          .payslip-zoom-wrapper {
            transform: none !important;
          }
        }
      `}</style>
      
      {/* ========================================================================= */}
      {/* ENTERPRISE PDF TOOLBAR (Fixed Top Header) */}
      {/* ========================================================================= */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20 print:hidden backdrop-blur-md">
        
        {/* Left: Back / Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-800 gap-2 font-medium text-xs px-2.5 h-8"
            title="Back to Payslips (ESC)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400 hidden sm:block" />
            <h2 className="text-sm font-semibold text-slate-100 truncate max-w-[220px] sm:max-w-xs">
              Payslip — {monthName} {yearName}
            </h2>
            <span className="hidden sm:inline-flex text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              {record.status || 'PAID'}
            </span>
          </div>
        </div>

        {/* Center: Zoom Controls & Presets */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/70 p-1 rounded-lg border border-slate-800/80">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <span className="text-xs font-mono font-bold text-slate-200 px-2 min-w-[50px] text-center">
            {zoom}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <div className="h-3.5 w-px bg-slate-800 mx-1 hidden md:block" />

          <Button
            variant={fitMode === 'FIT_PAGE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitPage}
            className="h-7 text-xs px-2 text-slate-300 hover:text-white hidden md:flex items-center gap-1 font-medium"
            title="Fit Full Page"
          >
            <Maximize2 className="w-3 h-3" />
            Fit Page
          </Button>

          <Button
            variant={fitMode === 'FIT_WIDTH' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitWidth}
            className="h-7 text-xs px-2 text-slate-300 hover:text-white hidden md:flex items-center gap-1 font-medium"
            title="Fit Width"
          >
            <Minimize2 className="w-3 h-3" />
            Fit Width
          </Button>
        </div>

        {/* Right: Download, Print, Close */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 h-8 px-3 text-xs font-semibold shadow-sm"
            title="Download Payslip PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1.5 h-8 px-3 text-xs font-semibold"
            title="Print Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full ml-1"
            title="Close Viewer (ESC)"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CANVAS CONTAINER */}
      {/* ========================================================================= */}
      <div 
        ref={viewportRef}
        className="payslip-pdf-viewer-canvas-container flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-950/70"
      >
        <div 
          className="payslip-zoom-wrapper transition-all duration-150 ease-out py-4"
          style={currentZoomStyle}
        >
          {/* ========================================================================= */}
          {/* A4 DOCUMENT CANVAS (210mm x 297mm) */}
          {/* ========================================================================= */}
          <div 
            id="printable-payslip"
            className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl shadow-black/80 rounded-sm p-10 flex flex-col justify-between border border-slate-700/20 box-border print:w-full print:min-h-0 print:shadow-none print:border-none print:p-6"
          >
            <div>
              {/* Company Header */}
              <div className="flex justify-between items-start pb-6 mb-6 border-b-2 border-slate-900">
                <div>
                  <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight mb-1">{companyName}</h1>
                  {companyAddress && <p className="text-xs text-slate-500 font-medium">{companyAddress}</p>}
                  {companyContact && <p className="text-xs text-slate-500 font-medium">{companyContact}</p>}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-slate-900 tracking-wider uppercase mb-1">PAYSLIP</h2>
                  <p className="text-xs font-bold text-slate-700">For the Month of: <span className="text-blue-600">{monthName} {yearName}</span></p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">Ref: #{record.id.slice(0, 10).toUpperCase()}</p>
                </div>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Employee Summary */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Employee Summary
                  </h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-2 text-xs">
                    <span className="text-slate-500 font-medium">Employee Name:</span>
                    <span className="font-bold text-slate-900">{employeeName}</span>
                    
                    <span className="text-slate-500 font-medium">Employee ID:</span>
                    <span className="font-mono font-semibold text-slate-800">{employeeId}</span>
                    
                    <span className="text-slate-500 font-medium">Email:</span>
                    <span className="text-slate-800 font-medium truncate">{employeeEmail}</span>

                    {departmentName !== '—' && (
                      <>
                        <span className="text-slate-500 font-medium">Department:</span>
                        <span className="text-slate-800 font-medium">{departmentName}</span>
                      </>
                    )}

                    {designationName !== '—' && (
                      <>
                        <span className="text-slate-500 font-medium">Designation:</span>
                        <span className="text-slate-800 font-medium">{designationName}</span>
                      </>
                    )}

                    {joiningDate !== '—' && (
                      <>
                        <span className="text-slate-500 font-medium">Joining Date:</span>
                        <span className="text-slate-800 font-medium">{joiningDate}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Payment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <p className="text-slate-500 font-medium mb-0.5">Payment Date</p>
                      <p className="font-bold text-slate-900">{format(new Date(record.paymentDate || new Date()), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium mb-0.5">Payment Status</p>
                      <span className="inline-block font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] uppercase border border-emerald-200">
                        {record.status || 'PAID'}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium mb-0.5">Transaction ID</p>
                      <p className="font-mono font-bold text-slate-800 text-[11px]">{record.transactionId || '—'}</p>
                    </div>
                    <div>
                       <p className="text-slate-500 font-medium mb-0.5">Payment Mode</p>
                       <p className="font-bold text-slate-900">{record.paymentMethod?.replace('_', ' ') || 'BANK TRANSFER'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-6 text-xs shadow-sm">
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  {/* Earnings Column */}
                  <div>
                    <div className="flex justify-between items-center bg-slate-100 px-4 py-3 border-b border-slate-200 font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                      <span>Earnings</span>
                      <span>Amount (INR)</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Basic Salary</span>
                        <span className="font-bold text-slate-900">₹{record.basicSalary?.toFixed(2)}</span>
                      </div>
                      {(record.hra > 0) && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">House Rent Allowance (HRA)</span>
                          <span className="font-bold text-slate-900">₹{record.hra?.toFixed(2)}</span>
                        </div>
                      )}
                      {(record.bonus > 0 || record.incentives > 0 || record.specialAllowance > 0) && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Bonus & Allowances</span>
                          <span className="font-bold text-slate-900">₹{((record.bonus || 0) + (record.incentives || 0) + (record.specialAllowance || 0)).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 font-extrabold text-slate-900 bg-slate-50 mt-4 text-xs">
                      <span>TOTAL EARNINGS</span>
                      <span>₹{totalEarnings.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center bg-slate-100 px-4 py-3 border-b border-slate-200 font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                        <span>Deductions</span>
                        <span>Amount (INR)</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Income Tax & Statutory Deductions</span>
                          <span className="font-bold text-rose-600">-₹{record.deductions?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 font-extrabold text-slate-900 bg-slate-50 text-xs">
                      <span>TOTAL DEDUCTIONS</span>
                      <span className="text-rose-600">-₹{record.deductions?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Box */}
              <div className="bg-emerald-50/90 border-2 border-emerald-300/80 rounded-xl p-5 flex justify-between items-center mb-6 shadow-sm">
                <div>
                  <span className="text-slate-600 font-bold uppercase tracking-wider text-xs block mb-0.5">Total Take-Home Pay</span>
                  <span className="text-emerald-900 font-extrabold text-2xl">Net Payable Salary</span>
                </div>
                <span className="text-emerald-700 font-black text-3xl">₹{record.netSalary?.toFixed(2)}</span>
              </div>
            </div>

            {/* Document Footer & Notice */}
            <div className="border-t border-slate-200 pt-6 mt-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    System Generated Official Document
                  </p>
                  <p className="text-[11px] text-slate-400">
                    This is a computer-generated payslip and does not require a physical signature.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Generated On: {format(new Date(), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block p-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-500">
                    AUTHENTICATED DOCUMENT
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
