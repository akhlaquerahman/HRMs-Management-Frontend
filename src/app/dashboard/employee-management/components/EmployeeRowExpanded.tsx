import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, FileText, Activity, ShieldCheck, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function EmployeeRowExpanded({ employee }: { employee: any }) {
  const { t } = useTranslation();

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 bg-blue-50/20 shadow-inner rounded-b-xl border-x border-b border-border/30">
      
      {/* Contact & Basic Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
          <User className="w-4 h-4" /> {t("Contact Details")}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-3.5 h-3.5" /> <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3.5 h-3.5" /> <span>{employee.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" /> <span className="truncate">{employee.city || employee.address || "—"}</span>
          </div>
        </div>
      </div>

      {/* Attendance & Leave Summary */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
          <Activity className="w-4 h-4" /> {t("Attendance & Leaves")}
        </h4>
        <div className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Attendance (YTD)</span>
              <span className="font-semibold">92%</span>
            </div>
            <Progress value={92} className="h-1.5" />
          </div>
          <div className="flex justify-between items-center bg-background rounded-md p-2 border shadow-sm">
            <span className="text-muted-foreground text-xs">Available Leaves</span>
            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">14 Days</span>
          </div>
        </div>
      </div>

      {/* Compliance & Documents */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> {t("Compliance")}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Documents</span>
            <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-1.5 py-0.5 rounded">Verified</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Bank Details</span>
            <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-1.5 py-0.5 rounded">Updated</span>
          </div>
        </div>
      </div>

      {/* Mini Recent Activity */}
      <div className="space-y-4 md:col-span-3 xl:col-span-1 border-t xl:border-t-0 xl:border-l pt-4 xl:pt-0 xl:pl-6 border-border/50">
        <h4 className="text-sm font-semibold text-primary">{t("Recent Activity")}</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-medium">Leave Approved</p>
              <p className="text-[10px] text-muted-foreground">2 days ago by HR</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-medium">Payroll Processed</p>
              <p className="text-[10px] text-muted-foreground">Last week</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
