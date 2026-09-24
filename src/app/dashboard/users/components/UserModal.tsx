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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { emailValidation, employeeNameValidation, passwordValidation } from "@/lib/validations/common.schema";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null; // null if creating
  roles: any[];
}

export function UserModal({ isOpen, onClose, user, roles }: UserModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const userSchema = z.object({
    firstName: employeeNameValidation,
    lastName: employeeNameValidation,
    email: emailValidation,
    password: user ? z.string().optional().refine(val => !val || val.length >= 8, "Password must be at least 8 characters (if provided)") : passwordValidation,
    roleId: z.string().min(1, "Role is required"),
    companyName: z.string().optional(),
    companyWebsite: z.string().optional(),
    companyAddress: z.string().optional(),
    companyPhone: z.string().optional(),
  });

  type UserFormData = z.infer<typeof userSchema>;

  const { register, handleSubmit, formState: { errors, isValid }, reset, setValue } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    mode: "onBlur",
    defaultValues: { 
      firstName: "", lastName: "", email: "", password: "", roleId: "", 
      companyName: "", companyWebsite: "", companyAddress: "", companyPhone: "" 
    }
  });

  useEffect(() => {
    if (user && isOpen) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        password: "", // Don't populate password on edit
        roleId: user.roleId || "",
        companyName: user.companyName || "",
        companyWebsite: user.companyWebsite || "",
        companyAddress: user.companyAddress || "",
        companyPhone: user.companyPhone || ""
      });
    } else if (isOpen) {
      reset({ 
        firstName: "", lastName: "", email: "", password: "", roleId: "", 
        companyName: "", companyWebsite: "", companyAddress: "", companyPhone: "" 
      });
    }
  }, [user, isOpen, reset]);

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      if (user) {
        // Edit mode (exclude password if empty)
        const payload = { ...data };
        if (!payload.password) {
          delete (payload as any).password;
        }
        await api.put(`/admin/users/${user.id}`, payload);
        toast.success(t("User updated successfully"));
      } else {
        // Create mode
        await api.post("/admin/users", data);
        toast.success(t("User created successfully"));
      }
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("Error saving user"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {user ? t("Edit User") : t("Create New User")}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? t("Update the details for this system user.")
              : t("Fill in the details below to create a new user account in the system.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 mb-4">Personal Details</h3>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("First Name")} *</label>
              <Input {...register("firstName")} placeholder="E.g. John" />
              {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Last Name")} *</label>
              <Input {...register("lastName")} placeholder="E.g. Doe" />
              {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Email Address")} *</label>
              <Input {...register("email")} type="email" placeholder="john.doe@company.com" />
              {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{user ? t("Password (Leave blank to keep current)") : t("Password *")}</label>
              <Input {...register("password")} type="password" placeholder="••••••••" />
              {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Role")} *</label>
              <select {...register("roleId")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="" disabled>Select Role</option>
                {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.roleId && <span className="text-xs text-red-500">{errors.roleId.message}</span>}
            </div>

            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 mb-4">Company Details (Optional)</h3>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Company Name")}</label>
              <Input {...register("companyName")} placeholder="E.g. Acme Corp" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Company Website")}</label>
              <Input {...register("companyWebsite")} placeholder="https://..." />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Company Phone")}</label>
              <Input 
                {...(() => {
                  const { onChange, ...rest } = register("companyPhone");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/[^0-9+\s()-]/g, '');
                      onChange(e);
                    }
                  }
                })()} 
                placeholder="+1 234 567 8900" 
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Company Address")}</label>
              <Input {...register("companyAddress")} placeholder="123 Business Blvd" />
            </div>

          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>{t("Cancel")}</Button>
            <Button type="submit" disabled={isSubmitting || !isValid} className="min-w-[120px] bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Saving...")}
                </>
              ) : (
                t("Save User")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
