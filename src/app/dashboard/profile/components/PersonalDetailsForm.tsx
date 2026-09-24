import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Phone, Mail, Briefcase, Hash, Calendar, Building2, UserCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { nameValidation, phoneValidation } from '@/lib/validations/common.schema';

const personalDetailsSchema = z.object({
  firstName: nameValidation,
  lastName: nameValidation,
  phone: phoneValidation,
});

type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

interface PersonalDetailsFormProps {
  formData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  employeeData?: {
    id: string;
    department?: { name: string };
    designation?: { title: string };
    manager?: { firstName: string; lastName: string };
    createdAt: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent, data: any) => void;
  isSaving: boolean;
}

export function PersonalDetailsForm({ formData, employeeData, setFormData, onSubmit, isSaving }: PersonalDetailsFormProps) {
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    },
  });

  useEffect(() => {
    reset({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    });
  }, [formData, reset]);

  const onFormSubmit = (data: PersonalDetailsFormData) => {
    // Update parent formData to reflect changes before submission
    setFormData((prev: any) => ({ ...prev, ...data }));
    // We pass a synthetic event just to satisfy the old signature, or we can just pass the new data
    // The parent uses `e.preventDefault()`, so we'll mock it
    onSubmit({ preventDefault: () => {} } as React.FormEvent, data);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full items-start">
      {/* Personal Information */}
      <div className="border border-primary/10 rounded-xl bg-primary/5 p-5 shadow-sm h-full flex flex-col">
        <div className="mb-4 border-b border-primary/10 pb-3">
          <h3 className="text-base font-bold text-foreground">{t("Personal Information")}</h3>
          <p className="text-xs text-muted-foreground">{t("Update your personal details here.")}</p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                {t("First Name")}
              </label>
              <Input 
                {...(() => {
                  const { onChange, ...rest } = register("firstName");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/[^a-zA-Z\s\'-]/g, '');
                      onChange(e);
                    }
                  }
                })()}
                className="h-8 text-sm bg-background/50 focus:bg-background transition-colors focus-visible:ring-primary/30"
              />
              {errors.firstName && <p className="text-[10px] text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                {t("Last Name")}
              </label>
              <Input 
                {...(() => {
                  const { onChange, ...rest } = register("lastName");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/[^a-zA-Z\s\'-]/g, '');
                      onChange(e);
                    }
                  }
                })()}
                className="h-8 text-sm bg-background/50 focus:bg-background transition-colors focus-visible:ring-primary/30"
              />
              {errors.lastName && <p className="text-[10px] text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <Phone className="w-3.5 h-3.5 text-primary" />
              {t("Mobile Number")}
            </label>
            <Input 
              placeholder="+91 9876543210" 
              {...(() => {
                  const { onChange, ...rest } = register("phone");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/[^\d+]/g, '');
                      onChange(e);
                    }
                  }
                })()}
              className="h-8 text-sm bg-background/50 focus:bg-background transition-colors focus-visible:ring-primary/30"
            />
            {errors.phone && <p className="text-[10px] text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center justify-between text-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {t("Email Address")}
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium border">Locked</span>
            </label>
            <Input 
              disabled 
              value={formData.email} 
              className="h-8 text-sm bg-muted/50 cursor-not-allowed text-muted-foreground/70" 
            />
          </div>

          <div className="flex justify-end pt-2 mt-auto">
            <Button type="submit" size="sm" disabled={isSaving} className="px-6 shadow-sm">
              {isSaving ? t("Saving...") : t("Save Changes")}
            </Button>
          </div>
        </form>
      </div>

      {/* Professional Information */}
      <div className="border rounded-xl bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm h-full flex flex-col">
        <div className="mb-4 border-b pb-3 flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 text-primary rounded-md">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{t("Professional Information")}</h3>
            <p className="text-xs text-muted-foreground">{t("Your internal company details.")}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 flex-1 content-start">
          <div className="space-y-1 bg-background/50 p-2.5 rounded-lg border border-muted/50">
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mb-0.5">
              <Hash className="w-3 h-3 text-primary/70" /> Emp ID
            </span>
            <span className="text-sm font-semibold text-foreground">{employeeData?.employeeId || "N/A"}</span>
          </div>
          
          <div className="space-y-1 bg-background/50 p-2.5 rounded-lg border border-muted/50">
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mb-0.5">
              <Building2 className="w-3 h-3 text-primary/70" /> Department
            </span>
            <span className="text-sm font-semibold text-foreground">{employeeData?.department?.name || "N/A"}</span>
          </div>
          
          <div className="space-y-1 bg-background/50 p-2.5 rounded-lg border border-muted/50">
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mb-0.5">
              <Briefcase className="w-3 h-3 text-primary/70" /> Designation
            </span>
            <span className="text-sm font-semibold text-foreground">{employeeData?.designation?.name || "N/A"}</span>
          </div>
          
          <div className="space-y-1 bg-background/50 p-2.5 rounded-lg border border-muted/50">
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mb-0.5">
              <UserCircle2 className="w-3 h-3 text-primary/70" /> Manager
            </span>
            <span className="text-sm font-semibold text-foreground">
              {employeeData?.manager ? `${employeeData.manager.firstName} ${employeeData.manager.lastName}` : "None"}
            </span>
          </div>
          
          <div className="space-y-1 bg-background/50 p-2.5 rounded-lg border border-muted/50 col-span-2">
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3 h-3 text-primary/70" /> Joined Since
            </span>
            <span className="text-sm font-semibold text-foreground">
              {employeeData?.createdAt ? format(new Date(employeeData.createdAt), 'PPP') : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
