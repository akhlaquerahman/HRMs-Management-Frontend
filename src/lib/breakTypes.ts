import { Utensils, Coffee, PauseCircle, Briefcase, Clock, LucideIcon } from 'lucide-react';

export type CanonicalBreakType = 'LUNCH' | 'TEA' | 'BIO' | 'OFFICIAL' | 'OTHER';

export interface BreakTypeConfig {
  id: CanonicalBreakType;
  label: string;
  shortLabel: string;
  iconName: string;
  icon: LucideIcon;
  emoji: string;
  color: string;
  badgeStyle: string;
  dot: string;
  desc: string;
}

export const BREAK_TYPES: BreakTypeConfig[] = [
  {
    id: 'LUNCH',
    label: 'Lunch Break',
    shortLabel: 'Lunch Break',
    iconName: 'Utensils',
    icon: Utensils,
    emoji: '🍱',
    color: 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-amber-500',
    desc: 'Standard meal break'
  },
  {
    id: 'TEA',
    label: 'Tea / Coffee Break',
    shortLabel: 'Tea Break',
    iconName: 'Coffee',
    icon: Coffee,
    emoji: '☕',
    color: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200',
    badgeStyle: 'bg-orange-100 text-orange-900 border-orange-300',
    dot: 'bg-orange-500',
    desc: 'Short refreshment break'
  },
  {
    id: 'BIO',
    label: 'Bio / Restroom Break',
    shortLabel: 'Bio Break',
    iconName: 'PauseCircle',
    icon: PauseCircle,
    emoji: '🚻',
    color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200',
    badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300',
    dot: 'bg-blue-500',
    desc: 'Wellness pause'
  },
  {
    id: 'OFFICIAL',
    label: 'Official / Client Call',
    shortLabel: 'Official Call',
    iconName: 'Briefcase',
    icon: Briefcase,
    emoji: '💼',
    color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200',
    badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300',
    dot: 'bg-purple-500',
    desc: 'Work-related out of office'
  },
  {
    id: 'OTHER',
    label: 'Personal / Quick Break',
    shortLabel: 'Quick Break',
    iconName: 'Clock',
    icon: Clock,
    emoji: '⏱',
    color: 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200',
    badgeStyle: 'bg-slate-100 text-slate-900 border-slate-300',
    dot: 'bg-slate-500',
    desc: 'General break'
  }
];

export const CANONICAL_BREAK_MAP: Record<CanonicalBreakType, BreakTypeConfig> = {
  LUNCH: BREAK_TYPES[0],
  TEA: BREAK_TYPES[1],
  BIO: BREAK_TYPES[2],
  OFFICIAL: BREAK_TYPES[3],
  OTHER: BREAK_TYPES[4]
};

export function getBreakTypeConfig(rawType?: string): BreakTypeConfig {
  if (!rawType) return CANONICAL_BREAK_MAP.TEA;

  const normalized = rawType.toUpperCase().trim();

  if (normalized === 'LUNCH' || normalized.includes('LUNCH')) return CANONICAL_BREAK_MAP.LUNCH;
  if (normalized === 'BIO' || normalized.includes('BIO') || normalized.includes('RESTROOM')) return CANONICAL_BREAK_MAP.BIO;
  if (normalized === 'OFFICIAL' || normalized.includes('OFFICIAL') || normalized.includes('CLIENT') || normalized.includes('MEETING')) return CANONICAL_BREAK_MAP.OFFICIAL;
  if (normalized === 'OTHER' || normalized.includes('OTHER') || normalized.includes('QUICK') || normalized.includes('PERSONAL')) return CANONICAL_BREAK_MAP.OTHER;
  if (normalized === 'TEA' || normalized.includes('TEA') || normalized.includes('COFFEE')) return CANONICAL_BREAK_MAP.TEA;

  return CANONICAL_BREAK_MAP.TEA;
}
