"use client";

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Settings2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

interface ManageLeaveQuotasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuotasData {
  annual: number;
  casual: number;
  medical: number;
  earned: number;
}

export function ManageLeaveQuotasModal({ isOpen, onClose }: ManageLeaveQuotasModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<QuotasData>({
    defaultValues: {
      annual: 18,
      casual: 8,
      medical: 10,
      earned: 5
    }
  });

  const { data: quotasResponse, isLoading: isLoadingQuotas } = useQuery({
    queryKey: ['leave-quotas'],
    queryFn: async () => {
      const res = await api.get('/leaves/quotas');
      return res.data;
    },
    enabled: isOpen
  });

  useEffect(() => {
    if (quotasResponse?.data) {
      reset({
        annual: quotasResponse.data.annual,
        casual: quotasResponse.data.casual,
        medical: quotasResponse.data.medical,
        earned: quotasResponse.data.earned
      });
    }
  }, [quotasResponse, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: QuotasData) => {
      const res = await api.put('/leaves/quotas', {
        annual: Number(data.annual),
        casual: Number(data.casual),
        medical: Number(data.medical),
        earned: Number(data.earned)
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-quotas'] });
      queryClient.invalidateQueries({ queryKey: ['leave-summary'] });
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
            <Settings2 className="w-5 h-5 text-blue-600" />
            {t("Manage Leave Quotas")}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isLoadingQuotas ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-muted-foreground animate-pulse">Loading current quotas...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                {t("Set the default company-wide allocated leave days for each leave type.")}
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("Annual Leave")}</label>
                <Input type="number" min="0" {...register('annual', { required: true })} className="w-full" />
                {errors.annual && <span className="text-xs text-rose-500">Required field</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("Casual Leave")}</label>
                <Input type="number" min="0" {...register('casual', { required: true })} className="w-full" />
                {errors.casual && <span className="text-xs text-rose-500">Required field</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("Medical Leave")}</label>
                <Input type="number" min="0" {...register('medical', { required: true })} className="w-full" />
                {errors.medical && <span className="text-xs text-rose-500">Required field</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("Earned Leave")}</label>
                <Input type="number" min="0" {...register('earned', { required: true })} className="w-full" />
                {errors.earned && <span className="text-xs text-rose-500">Required field</span>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/20">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("Save Changes")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
