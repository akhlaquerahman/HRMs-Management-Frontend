import React from 'react';
import { useTranslation } from 'react-i18next';
import { Database, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function StorageCapacityWidget({ metrics, loading }: { metrics: any, loading: boolean }) {
  const { t } = useTranslation();

  if (loading) {
    return <Card className="animate-pulse bg-muted/20 border-border/50 h-48" />;
  }

  const used = metrics?.usedGB || 0;
  const total = metrics?.totalGB || 5;
  const percentage = (used / total) * 100;

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
          <Database className="w-4 h-4" /> {t("Storage Capacity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-3xl font-bold">{used.toFixed(2)} GB</p>
            <p className="text-sm text-muted-foreground">{t("Used of")} {total} GB</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <HardDrive className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <Progress value={percentage} className="h-2 mt-4" />
        <p className="text-xs text-muted-foreground mt-2 text-right">{percentage.toFixed(1)}% {t("Used")}</p>
      </CardContent>
    </Card>
  );
}
