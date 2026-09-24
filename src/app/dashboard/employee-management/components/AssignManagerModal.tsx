import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

export function AssignManagerModal({ isOpen, onClose, employeeIds }: { isOpen: boolean, onClose: () => void, employeeIds: string[] }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      api.get('/employees').then(res => setManagers(res.data.data || []));
    }
  }, [isOpen]);

  const assignManager = useMutation({
    mutationFn: async (managerId: string) => {
      return await api.post('/employees/bulk', {
        action: 'ASSIGN_MANAGER',
        employeeIds,
        data: { managerId }
      });
    },
    onSuccess: () => {
      toast.success(t('Manager assigned successfully'));
      queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message);
    }
  });

  const handleAssign = () => {
    if (!selectedManager) return toast.error(t('Please select a manager'));
    assignManager.mutate(selectedManager);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Assign Manager")}</DialogTitle>
          <DialogDescription>
            {t("Select a manager to assign to the selected")} {employeeIds.length} {t("employee(s).")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select value={selectedManager} onValueChange={setSelectedManager}>
            <SelectTrigger>
              <SelectValue placeholder={t("Select Manager")} />
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={assignManager.isPending}>{t("Cancel")}</Button>
          <Button onClick={handleAssign} disabled={assignManager.isPending || !selectedManager}>
            {assignManager.isPending ? t("Assigning...") : t("Assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
