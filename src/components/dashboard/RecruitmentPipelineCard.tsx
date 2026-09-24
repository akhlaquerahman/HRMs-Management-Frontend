"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, FileText, Search, Award, CheckCircle2, 
  ArrowUpRight, Inbox, Filter 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStage {
  stage: string;
  label?: string;
  count: number;
  color?: string;
}

interface RecruitmentPipelineCardProps {
  pipeline?: PipelineStage[];
  isLoading?: boolean;
}

const STAGE_CONFIG: { [key: string]: { icon: any; colorBg: string; textHex: string } } = {
  Applied: { icon: FileText, colorBg: 'bg-blue-500', textHex: '#3b82f6' },
  Screening: { icon: Search, colorBg: 'bg-cyan-500', textHex: '#06b6d4' },
  Interview: { icon: Users, colorBg: 'bg-purple-500', textHex: '#8b5cf6' },
  Offered: { icon: Award, colorBg: 'bg-amber-500', textHex: '#f59e0b' },
  Hired: { icon: CheckCircle2, colorBg: 'bg-emerald-500', textHex: '#10b981' },
  Rejected: { icon: Filter, colorBg: 'bg-rose-500', textHex: '#f43f5e' }
};

export function RecruitmentPipelineCard({ pipeline, isLoading = false }: RecruitmentPipelineCardProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col min-h-[320px] animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-2" />
        <div className="h-3 w-56 bg-muted/60 rounded mb-6" />
        <div className="space-y-4 flex-1 justify-center">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-muted/40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const defaultPipeline: PipelineStage[] = [
    { stage: 'Applied', count: 45 },
    { stage: 'Screening', count: 12 },
    { stage: 'Interview', count: 8 },
    { stage: 'Offered', count: 2 }
  ];

  const stages = (pipeline && pipeline.length > 0) ? pipeline : defaultPipeline;
  const maxCount = Math.max(...stages.map(s => s.count || 0), 1);
  const totalCandidates = stages.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const handleStageClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/recruitment';
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      
      {/* Header Section */}
      <div className="flex items-start justify-between mb-5 border-b pb-3">
        <div>
          <h5 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t("Recruitment Pipeline")}
          </h5>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("Candidate distribution across hiring stages")}
          </p>
        </div>

        {totalCandidates > 0 && (
          <button 
            onClick={handleStageClick}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
            title="View Recruitment Module"
          >
            <span>{totalCandidates} Candidates</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Pipeline Content */}
      {totalCandidates === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg bg-muted/20">
          <Inbox className="w-10 h-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-semibold text-foreground">No Candidates in Pipeline</p>
          <p className="text-xs text-muted-foreground mt-1">
            Job applications will appear here as candidates apply.
          </p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {stages.map((stageItem, idx) => {
            const label = stageItem.label || stageItem.stage;
            const config = STAGE_CONFIG[label] || { icon: Users, colorBg: 'bg-primary', textHex: '#2563eb' };
            const Icon = config.icon;

            const percentage = Math.min(100, Math.max(8, Math.round((stageItem.count / maxCount) * 100)));

            return (
              <div 
                key={idx}
                onClick={handleStageClick}
                className="group cursor-pointer p-2 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-foreground font-semibold">{t(label)}</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-foreground bg-muted px-2 py-0.5 rounded border">
                    {stageItem.count}
                  </span>
                </div>

                {/* Animated Horizontal Bar */}
                <div className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500 ease-out", config.colorBg)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
