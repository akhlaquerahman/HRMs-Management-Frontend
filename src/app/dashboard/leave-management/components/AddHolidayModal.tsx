"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AddHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  initialData?: any;
}

export function AddHolidayModal({ isOpen, onClose, onSubmit, isLoading, initialData }: AddHolidayModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'NATIONAL'
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        type: initialData.type || 'NATIONAL'
      });
    } else if (!isOpen) {
      setFormData({ name: '', date: '', type: 'NATIONAL' });
    }
  }, [initialData, isOpen]);

  const isValid = formData.name && formData.date && formData.type;

  const handleSubmit = () => {
    onSubmit({
      ...initialData,
      name: formData.name,
      date: new Date(formData.date).toISOString(),
      type: formData.type
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? t("Edit Holiday") : t("Add New Holiday")}</DialogTitle>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>{t("Holiday Name")} *</Label>
            <Input 
              placeholder={t("e.g. New Year's Day")}
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("Date")} *</Label>
            <Input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("Type")} *</Label>
            <Select 
              value={formData.type}
              onValueChange={(val) => setFormData(p => ({ ...p, type: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NATIONAL">{t("National Holiday")}</SelectItem>
                <SelectItem value="REGIONAL">{t("Regional Holiday")}</SelectItem>
                <SelectItem value="OBSERVANCE">{t("Observance")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? t("Saving...") : t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
