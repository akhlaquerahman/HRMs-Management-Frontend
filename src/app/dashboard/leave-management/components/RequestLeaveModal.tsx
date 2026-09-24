"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isHR?: boolean;
}

export function RequestLeaveModal({ isOpen, onClose, onSubmit, isLoading, isHR }: RequestLeaveModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    employeeId: 'self',
    leaveType: '',
    startDate: '',
    endDate: '',
    halfDay: false,
    workFromHome: false,
    emergencyLeave: false,
    description: '',
    attachment: '',
    attachmentName: ''
  });

  const { data: employeesDataResponse } = useQuery({
    queryKey: ['employeesList'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=100');
      return res.data; // Return the entire response to match AddAttendanceModal cache shape
    },
    enabled: !!isHR
  });

  const employeesData = Array.isArray(employeesDataResponse?.data) 
    ? employeesDataResponse.data 
    : (employeesDataResponse?.data?.data || []);

  const isStep1Valid = formData.leaveType && formData.startDate && formData.endDate && (isHR ? formData.employeeId : true);
  const isStep2Valid = formData.description.length > 5;

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);
  const handleSubmit = () => onSubmit(formData);

  // Reset state when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => {
        setStep(1);
        setFormData({
          employeeId: 'self', leaveType: '', startDate: '', endDate: '', halfDay: false,
          workFromHome: false, emergencyLeave: false, description: '', attachment: '', attachmentName: ''
        });
      }, 300);
    }
  };

  const todayString = new Date().toLocaleDateString('en-CA'); // Gets local YYYY-MM-DD

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Request Leave")} - {t("Step")} {step} {t("of")} 2</DialogTitle>
          <div className="flex gap-2 mt-4">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              {isHR && (
                <div className="grid gap-2">
                  <Label>{t("Select Employee")}</Label>
                  <Select 
                    value={formData.employeeId}
                    onValueChange={(val) => setFormData(p => ({ ...p, employeeId: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select employee")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Request for Myself</SelectItem>
                      {employeesData.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>{t("Leave Type")} *</Label>
                <Select 
                  value={formData.leaveType}
                  onValueChange={(val) => setFormData(p => ({ ...p, leaveType: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select leave type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SICK">{t("Sick Leave")}</SelectItem>
                    <SelectItem value="CASUAL">{t("Casual Leave")}</SelectItem>
                    <SelectItem value="ANNUAL">{t("Annual Leave")}</SelectItem>
                    <SelectItem value="EARNED">{t("Earned Leave")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("Start Date")} *</Label>
                  <Input 
                    type="date" 
                    min={todayString}
                    value={formData.startDate}
                    onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("End Date")} *</Label>
                  <Input 
                    type="date" 
                    min={formData.startDate || todayString}
                    value={formData.endDate}
                    onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2 bg-muted/20 p-4 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="halfDay" 
                    checked={formData.halfDay}
                    onCheckedChange={(c) => setFormData(p => ({ ...p, halfDay: !!c }))}
                  />
                  <Label htmlFor="halfDay" className="font-normal">{t("Half Day")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="wfh" 
                    checked={formData.workFromHome}
                    onCheckedChange={(c) => setFormData(p => ({ ...p, workFromHome: !!c }))}
                  />
                  <Label htmlFor="wfh" className="font-normal">{t("Work From Home Request")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="emergency" 
                    checked={formData.emergencyLeave}
                    onCheckedChange={(c) => setFormData(p => ({ ...p, emergencyLeave: !!c }))}
                  />
                  <Label htmlFor="emergency" className="font-normal text-rose-600">{t("Emergency Leave")}</Label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label>{t("Reason / Description")} *</Label>
                <Textarea 
                  placeholder={t("Please provide a valid reason...")} 
                  className="h-32 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>{t("Supporting Document (Optional)")}</Label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {formData.attachment ? (
                        <>
                          <p className="mb-2 text-sm text-green-600 font-semibold truncate max-w-[200px]">
                            {formData.attachmentName || "Document attached"}
                          </p>
                          <p className="text-xs text-muted-foreground">Click to replace</p>
                        </>
                      ) : (
                        <>
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(p => ({ 
                              ...p, 
                              attachment: reader.result as string,
                              attachmentName: file.name
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex w-full sm:justify-between">
          {step === 1 ? (
            <div className="flex w-full justify-end">
              <Button onClick={handleNext} disabled={!isStep1Valid}>{t("Next Step")}</Button>
            </div>
          ) : (
            <div className="flex w-full justify-between">
              <Button variant="outline" onClick={handleBack}>{t("Back")}</Button>
              <Button onClick={handleSubmit} disabled={!isStep2Valid || isLoading}>
                {isLoading ? t("Submitting...") : t("Submit Request")}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
