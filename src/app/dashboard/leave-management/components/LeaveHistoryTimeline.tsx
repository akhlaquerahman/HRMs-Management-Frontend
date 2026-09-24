"use client";

import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaveHistoryTimelineProps {
  history: any[];
}

export function LeaveHistoryTimeline({ history }: LeaveHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic bg-card p-4 rounded border">
        No timeline available.
      </div>
    );
  }

  const getIcon = (action: string) => {
    switch (action) {
      case 'SUBMITTED': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'APPROVED': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'REJECTED': return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const getBg = (action: string) => {
    switch (action) {
      case 'SUBMITTED': return "bg-blue-100 border-blue-200";
      case 'APPROVED': return "bg-emerald-100 border-emerald-200";
      case 'REJECTED': return "bg-rose-100 border-rose-200";
      case 'CANCELLED': return "bg-gray-100 border-gray-200";
      default: return "bg-amber-100 border-amber-200";
    }
  };

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
      
      {history.map((item, index) => (
        <div key={item.id || index} className="flex gap-4 relative z-10">
          <div className={cn("w-8 h-8 rounded-full border flex items-center justify-center shrink-0 bg-card", getBg(item.action))}>
            {getIcon(item.action)}
          </div>
          
          <div className="flex-1 bg-card border rounded-lg p-3 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-1">
              <h5 className="font-semibold text-sm">
                {item.action.charAt(0) + item.action.slice(1).toLowerCase()}
              </h5>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(new Date(item.createdAt), 'MMM dd, h:mm a')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {item.comments}
            </p>
            {item.actedBy && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                By: <span className="font-medium text-foreground">{item.actedBy.firstName} {item.actedBy.lastName}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
