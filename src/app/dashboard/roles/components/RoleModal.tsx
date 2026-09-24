"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: any | null; // null if creating
}

export function RoleModal({ isOpen, onClose, role }: RoleModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    description: ""
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || "",
        description: role.description || ""
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (role) {
        // Edit mode (assuming backend has PUT /admin/roles/:id)
        await api.put(`/admin/roles/${role.id}`, formData);
        toast.success(t("Role updated successfully"));
      } else {
        // Create mode
        await api.post("/admin/roles", formData);
        toast.success(t("Role created successfully"));
      }
      queryClient.invalidateQueries({ queryKey: ["admin_roles"] });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("Error saving role"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {role ? t("Edit Role") : t("Create New Role")}
          </DialogTitle>
          <DialogDescription>
            {role 
              ? t("Update the details for this system role.")
              : t("Fill in the details below to create a new role.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            
            <div>
              <label className="text-sm font-medium mb-1 block">{t("Role Name")} *</label>
              <Input required placeholder="E.g. HR_MANAGER" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={role ? true : false} />
              {role && <span className="text-xs text-muted-foreground mt-1 block">Role names cannot be changed after creation.</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Description")}</label>
              <Input placeholder="Describe the role's purpose..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>{t("Cancel")}</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px] bg-blue-600 hover:bg-blue-700 shadow-sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Saving...")}
                </>
              ) : (
                t("Save Role")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
