"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BriefcaseMedical, CalendarDays, Plane, Award, Building, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaveBalanceCardsProps {
  balances: any;
  loading?: boolean;
}

export function LeaveBalanceCards({ balances, loading }: LeaveBalanceCardsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-5 animate-pulse flex flex-col gap-4 shadow-sm">
        <div className="h-5 bg-muted rounded w-1/4" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const quotas = {
    annual: 18,
    casual: 8,
    medical: 10,
    earned: 5,
    compOff: balances?.compOff || 0
  };

  const cards = [
    { title: 'Annual Leave', icon: Plane, remaining: balances?.annual ?? 18, total: quotas.annual, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    { title: 'Casual Leave', icon: CalendarDays, remaining: balances?.casual ?? 8, total: quotas.casual, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    { title: 'Medical Leave', icon: BriefcaseMedical, remaining: balances?.medical ?? 10, total: quotas.medical, color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
    { title: 'Earned Leave', icon: Award, remaining: balances?.earned ?? 5, total: quotas.earned, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    { title: 'Comp Off', icon: Building, remaining: balances?.compOff ?? 0, total: quotas.compOff, color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50', isDynamic: true }
  ];

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          {t("Leave Entitlements & Balances")}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
          Annual Allocation
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          const percentage = card.isDynamic ? 100 : Math.max(0, Math.min(100, (card.remaining / card.total) * 100));

          return (
            <div key={i} className="p-3.5 rounded-xl border bg-muted/20 flex flex-col justify-between gap-2.5 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-card shrink-0 border shadow-2xs">
                    <Icon className={cn("w-3.5 h-3.5", card.color.replace('bg-', 'text-'))} />
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate">{t(card.title)}</span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-lg font-bold text-foreground">{card.remaining}</span>
                  {!card.isDynamic && (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      / {card.total} {t('Remaining')}
                    </span>
                  )}
                  {card.isDynamic && (
                    <span className="text-[11px] text-muted-foreground font-medium">{t('Available')}</span>
                  )}
                </div>

                {!card.isDynamic && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-700", card.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
