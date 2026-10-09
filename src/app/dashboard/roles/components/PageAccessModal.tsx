"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, Lock, Building2, Users, Building, Clock, CalendarCheck, DollarSign, UserPlus, FolderOpen, FileText, User, Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ALL_MANAGEABLE_PAGES, getRolePagePermissions, setRolePagePermissions, DEFAULT_HR_PAGES } from '@/lib/pagePermissions';

interface PageAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: { id?: string; name: string; description?: string } | null;
}

const pageIconsMap: Record<string, React.ElementType> = {
  'dashboard': Building2,
  'organization': Building2,
  'employee-management': Users,
  'attendance': Clock,
  'leave-management': CalendarCheck,
  'payroll': DollarSign,
  'recruitment': UserPlus,
  'documents': FolderOpen,
  'my-attendance': Clock,
  'leave-request': CalendarCheck,
  'payslips': FileText,
  'my-documents': FolderOpen,
  'profile': User,
};

export function PageAccessModal({ isOpen, onClose, role }: PageAccessModalProps) {
  const { t } = useTranslation();
  const [selectedHrefs, setSelectedHrefs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (role?.name) {
      const perms = getRolePagePermissions(role.name);
      setSelectedHrefs(perms);
    }
  }, [role, isOpen]);

  if (!role) return null;

  const handleToggle = (href: string) => {
    setSelectedHrefs(prev => 
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const handleSelectAll = () => {
    setSelectedHrefs(ALL_MANAGEABLE_PAGES.map(p => p.href));
  };

  const handleDeselectAll = () => {
    setSelectedHrefs(['/dashboard', '/dashboard/profile']);
  };

  const handleResetDefaults = () => {
    const rawRole = role?.name || '';
    const normalizedRole = rawRole.toUpperCase().trim().replace(/[\s\_]+/g, '_');
    if (normalizedRole === 'EMPLOYEE' || normalizedRole === 'EMPLOYEES') {
      setSelectedHrefs([
        '/dashboard',
        '/dashboard/my-attendance',
        '/dashboard/leave-request',
        '/dashboard/payslips',
        '/dashboard/my-documents',
        '/dashboard/profile'
      ]);
    } else {
      setSelectedHrefs(DEFAULT_HR_PAGES);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await setRolePagePermissions(role.name, selectedHrefs);
      toast.success(t(`Page permissions updated for ${role.name}`));
      onClose();
    } catch (err: any) {
      toast.error(err.message || t("Failed to save page permissions"));
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['HR Management', 'Employee Self-Service', 'Core'] as const;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0 border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                {t("Manage Page Access")} - <Badge variant="secondary" className="font-mono text-xs font-bold uppercase">{role.name}</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {t("Control which dashboard pages are visible and accessible to users with this role.")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b bg-muted/20 px-4 text-xs font-medium text-muted-foreground shrink-0">
          <span>{selectedHrefs.length} of {ALL_MANAGEABLE_PAGES.length} pages enabled</span>
          <div className="flex gap-2">
            <button type="button" onClick={handleSelectAll} className="text-blue-600 hover:underline">Select All</button>
            <span>•</span>
            <button type="button" onClick={handleResetDefaults} className="text-blue-600 hover:underline">Reset Defaults</button>
            <span>•</span>
            <button type="button" onClick={handleDeselectAll} className="text-rose-600 hover:underline">Deselect All</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {categories.map(cat => {
            const pages = ALL_MANAGEABLE_PAGES.filter(p => p.category === cat);
            if (pages.length === 0) return null;

            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pages.map(page => {
                    const isChecked = selectedHrefs.includes(page.href);
                    const IconComp = pageIconsMap[page.id] || Lock;

                    return (
                      <div 
                        key={page.id} 
                        onClick={() => handleToggle(page.href)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked 
                            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-2xs' 
                            : 'bg-card hover:bg-muted/50 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox 
                            checked={isChecked} 
                            onCheckedChange={() => handleToggle(page.href)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <IconComp className={`w-4 h-4 shrink-0 ${isChecked ? 'text-blue-600' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-semibold truncate ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {page.title}
                          </span>
                        </div>
                        {isChecked && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t pt-4 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>{t("Cancel")}</Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 font-semibold">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
            {t("Save Page Permissions")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
