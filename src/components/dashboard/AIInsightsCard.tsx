"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

export function AIInsightsCard({ insights }: { insights?: any[] }) {
  const items = insights && insights.length > 0 ? insights : [
    { title: "Attendance Insight", message: "Your attendance is 95% this month. Great job!" },
    { title: "Leave Balance", message: "You have 12 annual leave days remaining." }
  ];

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-base font-semibold text-foreground">AI Insights</h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((item: any, i: number) => (
          <div key={i} className="p-3 rounded-lg bg-card border text-xs text-muted-foreground">
            <span className="font-semibold text-foreground block mb-0.5">{item.title || "Insight"}</span>
            {item.message || item.text || (typeof item === 'string' ? item : JSON.stringify(item))}
          </div>
        ))}
      </div>
    </div>
  );
}
