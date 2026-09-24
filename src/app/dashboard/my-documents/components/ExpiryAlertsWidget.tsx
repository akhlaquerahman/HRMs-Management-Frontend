import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export function ExpiryAlertsWidget({ alerts, loading }: { alerts: any[], loading: boolean }) {
  const { t } = useTranslation();

  if (loading) {
    return <Card className="animate-pulse bg-muted/20 border-border/50 h-48" />;
  }

  if (!alerts || alerts.length === 0) {
    return null; // Don't show if no alerts
  }

  return (
    <Card className="shadow-sm border-border/50 border-l-4 border-l-amber-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {t("Documents Expiring Soon")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((doc, idx) => (
            <div key={idx} className="flex justify-between items-center bg-amber-50/50 p-2 rounded-md">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">{doc.documentType}</span>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {t("Expires in")} {formatDistanceToNow(new Date(doc.expiryDate))}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
