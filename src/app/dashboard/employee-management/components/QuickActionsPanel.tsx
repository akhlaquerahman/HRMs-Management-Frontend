import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UserCheck, Settings, DownloadCloud, UploadCloud, Users } from 'lucide-react';

export function QuickActionsPanel() {
  const { t } = useTranslation();

  const actions = [
    { label: "Add Employee", icon: UserPlus, variant: "default" as any },
    { label: "Assign Managers", icon: Users, variant: "outline" as any },
    { label: "Approve Leaves", icon: UserCheck, variant: "outline" as any },
    { label: "Upload Documents", icon: UploadCloud, variant: "outline" as any },
    { label: "Generate Payroll", icon: Settings, variant: "outline" as any },
    { label: "Bulk Export", icon: DownloadCloud, variant: "outline" as any },
  ];

  return (
    <Card className="shadow-sm border-border/50 sticky top-6">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <CardTitle className="text-sm font-semibold">{t("Quick Actions")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {actions.map((action, i) => (
          <Button 
            key={i} 
            variant={action.variant} 
            className="w-full justify-start font-medium"
          >
            <action.icon className="w-4 h-4 mr-3 opacity-70" />
            {t(action.label)}
          </Button>
        ))}
        
        <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Smart Alerts")}</h4>
          <div className="bg-rose-50 border border-rose-100 rounded p-3 text-sm text-rose-800">
            <span className="font-semibold block mb-1">Incomplete Profiles</span>
            2 employees require profile completion.
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded p-3 text-sm text-amber-800">
            <span className="font-semibold block mb-1">Probation Ending</span>
            3 employees finishing probation this week.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
