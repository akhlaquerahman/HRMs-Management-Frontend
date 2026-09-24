import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Briefcase, FileSpreadsheet, Building2, GraduationCap, Scale, HeartPulse } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function DocumentCategoriesGrid({ metrics, loading }: { metrics: any[], loading: boolean }) {
  const { t } = useTranslation();

  const categories = [
    { id: 'IDENTITY', label: 'Identity Documents', icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'EMPLOYMENT', label: 'Employment Documents', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'PAYROLL', label: 'Payroll Documents', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'BANK', label: 'Bank Documents', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'EDUCATION', label: 'Education Documents', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'COMPLIANCE', label: 'Compliance Documents', icon: Scale, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'MEDICAL', label: 'Medical Documents', icon: HeartPulse, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-muted/20 border-border/50 h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {categories.map((cat) => {
        const data = metrics?.find(m => m.category === cat.id) || { count: 0, completion: 0 };
        return (
          <Card key={cat.id} className="shadow-sm border-border/50 hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${cat.bg}`}>
                  <cat.icon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <h4 className="font-semibold text-sm line-clamp-1">{t(cat.label)}</h4>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-xs text-muted-foreground">{data.count} Files</span>
                  <span className="text-xs font-medium">{data.completion}%</span>
                </div>
                <Progress value={data.completion} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
