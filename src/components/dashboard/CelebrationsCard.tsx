"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Award, Calendar, Sparkles, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';

interface CelebrationEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  photo?: string;
  dob?: string;
  joiningDate?: string;
  department?: { name: string };
  designation?: { name: string };
  daysRemaining?: number;
  yearsCompleted?: number;
}

interface CelebrationsCardProps {
  upcomingBirthdays?: CelebrationEmployee[];
  workAnniversaries?: CelebrationEmployee[];
}

export function CelebrationsCard({ upcomingBirthdays = [], workAnniversaries = [] }: CelebrationsCardProps) {
  const { t } = useTranslation();

  const hasBirthdays = upcomingBirthdays.length > 0;
  const hasAnniversaries = workAnniversaries.length > 0;
  const hasAny = hasBirthdays || hasAnniversaries;

  const formatCountdown = (days?: number) => {
    if (days === undefined || days === null) return '';
    if (days === 0) return '🎉 Today!';
    if (days === 1) return '🎂 Tomorrow';
    return `In ${days} days`;
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-500" />
          {t('Upcoming Celebrations')}
        </h3>
        <span className="text-[11px] font-medium text-muted-foreground bg-pink-500/10 text-pink-600 px-2 py-0.5 rounded-full border border-pink-500/20">
          Next 30 Days
        </span>
      </div>

      {!hasAny ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <PartyPopper className="w-8 h-8 mb-2 text-muted-foreground/30" />
          <p className="text-sm font-medium">{t('No upcoming celebrations.')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Birthdays and work anniversaries will automatically appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Upcoming Birthdays Section */}
          {hasBirthdays && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-500" />
                  Upcoming Birthdays
                </span>
                <span className="text-[10px] text-muted-foreground font-mono font-semibold">({upcomingBirthdays.length})</span>
              </div>

              <div className="space-y-2">
                {upcomingBirthdays.map((emp) => {
                  const bdayStr = emp.dob ? format(new Date(emp.dob), 'dd MMM') : '';
                  const isToday = emp.daysRemaining === 0;

                  return (
                    <div
                      key={emp.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        isToday
                          ? 'bg-gradient-to-r from-pink-50/90 to-purple-50/90 dark:from-pink-950/30 dark:to-purple-950/30 border-pink-300 dark:border-pink-800 shadow-xs'
                          : 'bg-card hover:bg-muted/30 border-muted/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.firstName} className="w-8 h-8 rounded-full object-cover border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {emp.department?.name || emp.designation?.name || 'Staff'} • {bdayStr}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 border ${
                          isToday
                            ? 'bg-pink-600 text-white border-pink-600 shadow-xs animate-pulse'
                            : 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20'
                        }`}
                      >
                        {formatCountdown(emp.daysRemaining)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Work Anniversaries Section */}
          {hasAnniversaries && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Work Anniversaries
                </span>
                <span className="text-[10px] text-muted-foreground font-mono font-semibold">({workAnniversaries.length})</span>
              </div>

              <div className="space-y-2">
                {workAnniversaries.map((emp) => {
                  const joinStr = emp.joiningDate ? format(new Date(emp.joiningDate), 'dd MMM yyyy') : '';
                  const years = emp.yearsCompleted || 1;
                  const isToday = emp.daysRemaining === 0;

                  return (
                    <div
                      key={emp.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        isToday
                          ? 'bg-gradient-to-r from-amber-50/90 to-yellow-50/90 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-300 dark:border-amber-800 shadow-xs'
                          : 'bg-card hover:bg-muted/30 border-muted/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {years} {years === 1 ? 'Year' : 'Years'} Service • Joined {joinStr}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isToday
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                          }`}
                        >
                          {years} {years === 1 ? 'Year' : 'Years'} Anniversary
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {formatCountdown(emp.daysRemaining)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
