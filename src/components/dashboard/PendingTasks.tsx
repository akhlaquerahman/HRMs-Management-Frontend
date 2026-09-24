"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, CalendarCheck, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'LEAVE' | 'CORRECTION' | 'ONBOARDING' | 'DOCUMENT';
  status: 'URGENT' | 'NORMAL';
  createdAt: string;
}

interface PendingTasksProps {
  tasks: Task[];
  loading?: boolean;
}

export function PendingTasks({ tasks, loading }: PendingTasksProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          {t('Pending Approvals')}
        </h3>
        {tasks?.length > 0 && (
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar flex-1">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 animate-pulse border">
              <div className="w-10 h-10 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : tasks?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground h-full">
            <CheckCircle2 className="w-8 h-8 mb-2 text-green-500/50" />
            <p className="text-sm">{t("You're all caught up!")}</p>
          </div>
        ) : (
          tasks?.map(task => {
            let Icon = ClipboardList;
            let color = "text-blue-500 bg-blue-100";
            
            if (task.type === 'LEAVE') { Icon = CalendarCheck; color = "text-orange-500 bg-orange-100"; }
            else if (task.type === 'DOCUMENT') { Icon = FileCheck; color = "text-purple-500 bg-purple-100"; }
            else if (task.type === 'CORRECTION') { Icon = AlertCircle; color = "text-red-500 bg-red-100"; }

            return (
              <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
                <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", color)}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {task.title}
                    </h4>
                    {task.status === 'URGENT' && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {task.description}
                  </p>
                </div>
                
                <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs">View</Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
