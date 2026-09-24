import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { UserCircle, MapPin, Phone, Mail, Building2, Calendar, FileText, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { EditEmployeeModal } from './EditEmployeeModal';

export function EmployeeProfileDrawer({ employeeId, isOpen, onClose }: { employeeId: string, isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employeeDetails', employeeId],
    queryFn: async () => (await api.get(`/employees/${employeeId}/details`)).data.data,
    enabled: !!employeeId && isOpen
  });

  const deactivateEmployee = useMutation({
    mutationFn: async () => {
      return await api.put(`/employees/${employeeId}`, { status: 'INACTIVE' });
    },
    onSuccess: () => {
      toast.success(t('Employee deactivated successfully'));
      queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDetails', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['workforceDashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message);
    }
  });

  const handleDeactivate = () => {
    if (confirm(t("Are you sure you want to deactivate this account?"))) {
      deactivateEmployee.mutate();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-md w-full p-0 flex flex-col border-l border-border/50">
          <SheetHeader className="p-6 pb-4 border-b border-border/50 bg-muted/10">
            <div className="flex justify-between items-start">
              <SheetTitle>{t("Employee Profile")}</SheetTitle>
            </div>
            <SheetDescription>{t("Detailed overview of the employee's record.")}</SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
              <div className="h-24 bg-muted rounded animate-pulse" />
              <div className="h-32 bg-muted rounded animate-pulse" />
            </div>
          ) : employee ? (
            <ScrollArea className="flex-1 p-6">
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold shadow-inner">
                  {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{employee.firstName} {employee.lastName}</h2>
                  <p className="text-sm text-muted-foreground">{employee.designation?.name}</p>
                  <Badge variant={employee.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-2">
                    {employee.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                {/* Job Details */}
                <div className="bg-card border shadow-sm rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> {t("Job Details")}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-1">Employee ID</span>
                      <span className="font-medium">{employee.employeeId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-1">Department</span>
                      <span className="font-medium">{employee.department?.name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-1">Employment Type</span>
                      <span className="font-medium">{employee.employmentType?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-1">Joining Date</span>
                      <span className="font-medium">{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-1">Base Salary (CTC)</span>
                      <span className="font-medium text-emerald-600">₹{employee.baseSalary?.toLocaleString() || "0"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-1">Reporting Manager</span>
                      <span className="font-medium flex items-center gap-1.5">
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        {employee.department?.managerId === employee.id
                          ? "Department Head"
                          : employee.manager
                          ? `${employee.manager.firstName} ${employee.manager.lastName}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-card border shadow-sm rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {t("Contact Information")}</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{employee.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{employee.city || employee.address || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button className="w-full" onClick={() => setIsEditModalOpen(true)}>{t("Edit Full Profile")}</Button>
                  {employee.status === 'ACTIVE' ? (
                    <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={handleDeactivate} disabled={deactivateEmployee.isPending}>
                      {deactivateEmployee.isPending ? t("Deactivating...") : t("Deactivate Account")}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full text-emerald-600 hover:bg-emerald-50" onClick={() => {
                      if (confirm(t("Activate this account?"))) {
                        api.put(`/employees/${employeeId}`, { status: 'ACTIVE' }).then(() => {
                          toast.success(t('Employee activated'));
                          queryClient.invalidateQueries({ queryKey: ['workforceEmployees'] });
                          queryClient.invalidateQueries({ queryKey: ['employeeDetails'] });
                          queryClient.invalidateQueries({ queryKey: ['workforceDashboard'] });
                        });
                      }
                    }}>
                      {t("Activate Account")}
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </SheetContent>
      </Sheet>

      <EditEmployeeModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        employee={employee} 
      />
    </>
  );
}
