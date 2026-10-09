"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
}

export function AssignRoleModal({ isOpen, onClose, employee }: AssignRoleModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [targetRole, setTargetRole] = useState<'MANAGER' | 'EMPLOYEES'>('MANAGER');
  const [managers, setManagers] = useState<any[]>([]);
  const [reassignManagerId, setReassignManagerId] = useState<string>('');
  const [subordinatesCount, setSubordinatesCount] = useState<number>(0);
  const [requiresReassignment, setRequiresReassignment] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && employee) {
      const isManager = employee.user?.role?.name === 'MANAGER' || employee.role === 'MANAGER';
      setTargetRole(isManager ? 'EMPLOYEES' : 'MANAGER');
      setRequiresReassignment(false);

      api.get('/employees').then(res => {
        const list = res.data.data || [];
        setManagers(list.filter((m: any) => m.id !== employee.id));
      });

      api.get(`/employees/${employee.id}/manager-scope`).then(res => {
        const data = res.data.data;
        if (data?.subordinatesCount > 0) {
          setSubordinatesCount(data.subordinatesCount);
        } else {
          setSubordinatesCount(0);
        }
      }).catch(() => {});
    }
  }, [isOpen, employee]);

  const toggleRoleMutation = useMutation({
    mutationFn: async () => {
      if (targetRole === 'MANAGER') {
        return await api.post(`/employees/${employee.id}/assign-manager`, { departmentIds: employee.departmentId ? [employee.departmentId] : [] });
      } else {
        return await api.post(`/employees/${employee.id}/remove-manager`, { reassignToManagerId: reassignManagerId || undefined });
      }
    },
    onSuccess: (res: any) => {
      if (res.data?.data?.requiresReassignment) {
        setRequiresReassignment(true);
        toast.warning(res.data.data.message);
        return;
      }
      toast.success(res.data?.message || t('Role updated successfully'));
      queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['workforceDashboard'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('Failed to update role'));
    }
  });

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            {t("Change Employee Role")}
          </DialogTitle>
          <DialogDescription>
            {t("Promote or demote")} <span className="font-semibold">{employee.firstName} {employee.lastName}</span> {t("between EMPLOYEES and MANAGER roles.")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t("Target Canonical Role")}</label>
            <Select value={targetRole} onValueChange={(val: any) => setTargetRole(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">MANAGER (Department & Team Access)</SelectItem>
                <SelectItem value="EMPLOYEES">EMPLOYEES (Regular Self-Service)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetRole === 'EMPLOYEES' && subordinatesCount > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{employee.firstName} has {subordinatesCount} direct report(s). Select a replacement manager:</span>
              </div>
              <Select value={reassignManagerId} onValueChange={setReassignManagerId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t("Select Replacement Reporting Manager")} />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={toggleRoleMutation.isPending}>{t("Cancel")}</Button>
          <Button onClick={() => toggleRoleMutation.mutate()} disabled={toggleRoleMutation.isPending || (targetRole === 'EMPLOYEES' && subordinatesCount > 0 && !reassignManagerId)}>
            {toggleRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {targetRole === 'MANAGER' ? t("Assign as Manager") : t("Remove Manager Role")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
