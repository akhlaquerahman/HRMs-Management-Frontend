import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, CheckCircle, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SecurityStatusCard() {
  const { t } = useTranslation();

  return (
    <Card className="shadow-sm border-border/50 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> {t("Security Status")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">AES-256 Encryption</span>
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Cloud Backup</span>
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Role-Based Access</span>
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Last scan passed successfully
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
