"use client";

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Megaphone,
  Calendar,
  Plus,
  Trash2,
  ShieldAlert,
  Loader2,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  TimerReset,
  Building2,
  Search,
  Eye,
  Sparkles,
  Users,
  ShieldCheck,
  CalendarDays,
  XCircle,
  Bell,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  target?: string;
  isActive?: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  author?: {
    firstName: string;
    lastName: string;
    companyName?: string;
    email?: string;
  };
}

interface CompanyAnnouncementsProps {
  announcements?: Announcement[];
  loading?: boolean;
}

export function CompanyAnnouncements({
  announcements: initialData,
  loading: initialLoading
}: CompanyAnnouncementsProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Dialog & state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'ACTIVE' | 'EXPIRED' | 'ALL'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO',
    target: 'ALL',
    expiryPreset: 'never',
    customExpiresAt: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  // User & role check
  const rawRole = typeof user?.role === 'string' ? user.role.toUpperCase().trim().replace(/\s+/g, '_') : '';
  const isHRAdmin = ['HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(rawRole);
  const userCompanyName = user?.companyName || 'Radical Minds Technologies Pvt. Ltd.';

  // Query announcements with user-scoped cache key
  const { data: fetchedAnnouncements, isLoading } = useQuery({
    queryKey: ['company_announcements', user?.id || 'guest'],
    queryFn: async () => {
      try {
        const res = await api.get('/announcements');
        return res.data?.data || [];
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallbackRes = await api.get('/dashboard/announcements');
          return fallbackRes.data?.data || [];
        }
        throw err;
      }
    },
    initialData: initialData && initialData.length > 0 ? initialData : undefined
  });

  const announcements = (fetchedAnnouncements && fetchedAnnouncements.length > 0)
    ? fetchedAnnouncements
    : (initialData && initialData.length > 0 ? initialData : (fetchedAnnouncements || []));

  // Create Announcement Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      try {
        const res = await api.post('/announcements', payload);
        return res.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallbackRes = await api.post('/dashboard/announcements', payload);
          return fallbackRes.data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to publish announcement');
    }
  });

  // Expire / Toggle Announcement Mutation
  const expireMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'expire' | 'reactivate' }) => {
      try {
        const res = await api.patch(`/announcements/${id}/expire`, { action });
        return res.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallbackRes = await api.patch(`/dashboard/announcements/${id}/expire`, { action });
          return fallbackRes.data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    }
  });

  // Delete Announcement Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/announcements/${id}`);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          await api.delete(`/dashboard/announcements/${id}`);
        } else {
          throw err;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setDeleteTargetId(null);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'INFO',
      target: 'ALL',
      expiryPreset: 'never',
      customExpiresAt: ''
    });
    setErrorMsg('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Please enter an announcement title');
      return;
    }
    if (!formData.content.trim()) {
      setErrorMsg('Please enter announcement details');
      return;
    }

    let calculatedExpiresAt: string | null = null;
    const now = new Date();

    if (formData.expiryPreset === '24h') {
      calculatedExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else if (formData.expiryPreset === '3d') {
      calculatedExpiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    } else if (formData.expiryPreset === '7d') {
      calculatedExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (formData.expiryPreset === '30d') {
      calculatedExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (formData.expiryPreset === 'custom' && formData.customExpiresAt) {
      calculatedExpiresAt = new Date(formData.customExpiresAt).toISOString();
    }

    createMutation.mutate({
      title: formData.title.trim(),
      content: formData.content.trim(),
      type: formData.type,
      target: formData.target,
      expiresAt: calculatedExpiresAt
    });
  };

  const isAnnouncementExpired = (item: Announcement) => {
    if (item.isActive === false) return true;
    if (item.expiresAt) {
      try {
        return isPast(new Date(item.expiresAt));
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const activeCount = useMemo(() => {
    return (announcements || []).filter(a => !isAnnouncementExpired(a)).length;
  }, [announcements]);

  const expiredCount = useMemo(() => {
    return (announcements || []).filter(a => isAnnouncementExpired(a)).length;
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    let list = Array.isArray(announcements) ? [...announcements] : [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.author?.firstName?.toLowerCase().includes(q) ||
          a.author?.lastName?.toLowerCase().includes(q)
      );
    }

    if (isHRAdmin) {
      if (filterTab === 'ACTIVE') {
        list = list.filter(a => !isAnnouncementExpired(a));
      } else if (filterTab === 'EXPIRED') {
        list = list.filter(a => isAnnouncementExpired(a));
      }
    } else {
      list = list.filter(a => !isAnnouncementExpired(a));
    }

    return list;
  }, [announcements, searchQuery, filterTab, isHRAdmin]);

  const getPriorityConfig = (type: string) => {
    switch (type) {
      case 'URGENT':
        return {
          label: 'CRITICAL',
          icon: AlertTriangle,
          badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
          cardBorder: 'border-l-rose-500 hover:border-rose-400',
          accentBg: 'hover:bg-rose-500/[0.02]'
        };
      case 'WARNING':
        return {
          label: 'ALERT',
          icon: Clock,
          badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
          cardBorder: 'border-l-amber-500 hover:border-amber-400',
          accentBg: 'hover:bg-amber-500/[0.02]'
        };
      case 'SUCCESS':
        return {
          label: 'EVENT',
          icon: CheckCircle2,
          badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
          cardBorder: 'border-l-emerald-500 hover:border-emerald-400',
          accentBg: 'hover:bg-emerald-500/[0.02]'
        };
      default:
        return {
          label: 'NOTICE',
          icon: Info,
          badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
          cardBorder: 'border-l-blue-500 hover:border-blue-400',
          accentBg: 'hover:bg-blue-500/[0.02]'
        };
    }
  };

  const getTargetLabel = (target?: string) => {
    switch (target) {
      case 'EMPLOYEE':
        return 'Employees';
      case 'HR_MANAGER':
        return 'HR Team';
      default:
        return 'All Staff';
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-xs p-4 sm:p-5 flex flex-col gap-3.5">
      {/* Header Bar (Tailored to fit cleanly in 4-column sidebar) */}
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                {t('Announcements')}
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                {activeCount} Active
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5 max-w-[190px]">
              <Building2 className="w-3 h-3 opacity-60 shrink-0" />
              <span className="truncate">{userCompanyName}</span>
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/dashboard/announcements"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors"
            title="View Full Announcement Board"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {isHRAdmin && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="h-7.5 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1 rounded-md shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Segmented Control Filter Tabs for HR Admin */}
      {isHRAdmin && (
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/40 text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('ACTIVE')}
            className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
              filterTab === 'ACTIVE'
                ? 'bg-card text-foreground shadow-2xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('EXPIRED')}
            className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
              filterTab === 'EXPIRED'
                ? 'bg-card text-foreground shadow-2xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Expired ({expiredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
              filterTab === 'ALL'
                ? 'bg-card text-foreground shadow-2xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({announcements?.length || 0})
          </button>
        </div>
      )}

      {/* Search Input for quick filter */}
      {isHRAdmin && (announcements?.length || 0) > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-7.5 pl-8 pr-2.5 text-xs rounded-lg border bg-background/50 focus:bg-background outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 transition-colors"
          />
        </div>
      )}

      {/* Announcements Feed Container */}
      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px] pr-0.5 custom-scrollbar">
        {isLoading || initialLoading ? (
          [1, 2].map(i => (
            <div key={i} className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/20 animate-pulse border">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-full mt-1"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))
        ) : filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-3 text-center rounded-xl border border-dashed bg-muted/10">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Bell className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              {filterTab === 'EXPIRED' ? 'No expired announcements' : t('No active announcements')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px]">
              {isHRAdmin
                ? 'Publish announcements to keep your organization updated.'
                : 'Check back later for company notices and events.'}
            </p>
            {isHRAdmin && filterTab !== 'EXPIRED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsCreateOpen(true);
                }}
                className="mt-3 h-7.5 text-xs font-semibold gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Post Announcement
              </Button>
            )}
          </div>
        ) : (
          filteredAnnouncements.map((announcement: Announcement) => {
            const expired = isAnnouncementExpired(announcement);
            const priority = getPriorityConfig(announcement.type);
            const PriorityIcon = priority.icon;

            return (
              <div
                key={announcement.id}
                onClick={() => setSelectedAnnouncement(announcement)}
                className={`group flex flex-col gap-2 p-3 sm:p-3.5 rounded-xl border border-l-4 transition-all cursor-pointer ${
                  priority.cardBorder
                } ${priority.accentBg} ${
                  expired
                    ? 'bg-muted/10 border-dashed border-muted text-muted-foreground opacity-70'
                    : 'bg-card hover:shadow-xs hover:border-border'
                }`}
              >
                {/* Top Badge & Controls Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${priority.badge}`}
                    >
                      <PriorityIcon className="w-2.5 h-2.5 shrink-0" />
                      {priority.label}
                    </span>

                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground">
                      {getTargetLabel(announcement.target)}
                    </span>

                    {expired ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <XCircle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                        EXPIRED
                      </span>
                    ) : announcement.expiresAt ? (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400 font-medium"
                        title={`Expires: ${format(new Date(announcement.expiresAt), 'PPP p')}`}
                      >
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>Exp: {format(new Date(announcement.expiresAt), 'MMM dd')}</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Actions for HR Admin */}
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {isHRAdmin && (
                      <>
                        {expired ? (
                          <button
                            type="button"
                            onClick={() =>
                              expireMutation.mutate({ id: announcement.id, action: 'reactivate' })
                            }
                            disabled={expireMutation.isPending}
                            className="p-1 rounded text-muted-foreground hover:text-emerald-600 transition-colors"
                            title="Reactivate announcement"
                          >
                            <TimerReset className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              expireMutation.mutate({ id: announcement.id, action: 'expire' })
                            }
                            disabled={expireMutation.isPending}
                            className="p-1 rounded text-muted-foreground hover:text-amber-600 transition-colors"
                            title="Expire immediately"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(announcement.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded text-muted-foreground hover:text-rose-600 transition-colors"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4
                  className={`font-semibold text-xs leading-snug line-clamp-1 group-hover:text-primary transition-colors ${
                    expired ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {announcement.title}
                </h4>

                {/* Content snippet */}
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {announcement.content}
                </p>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-1.5 border-border/50">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary shrink-0 opacity-80" />
                    <span>{format(new Date(announcement.createdAt), 'MMM dd, yyyy')}</span>
                  </div>

                  {announcement.author && (
                    <span className="font-medium text-foreground truncate max-w-[120px]">
                      {announcement.author.firstName} {announcement.author.lastName}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* HR Create Announcement Dialog Modal */}
      {isHRAdmin && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md p-5 sm:p-6">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                <Megaphone className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Publish Announcement
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Broadcast an official announcement to employees in <strong className="text-foreground">{userCompanyName}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs mt-2">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Title *</Label>
                <Input
                  required
                  placeholder="e.g. Q4 All-Hands Town Hall & Performance Awards"
                  className="h-8.5 text-xs"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Priority Category (Interactive Tiles) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Priority Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'INFO', label: 'Notice', desc: 'General Info', icon: Info, color: 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400' },
                    { key: 'SUCCESS', label: 'Event', desc: 'Milestone / Win', icon: CheckCircle2, color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
                    { key: 'WARNING', label: 'Alert', desc: 'Policy / Caution', icon: Clock, color: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
                    { key: 'URGENT', label: 'Critical', desc: 'Action Required', icon: AlertTriangle, color: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400' }
                  ].map(opt => {
                    const isSelected = formData.type === opt.key;
                    const OptIcon = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setFormData({ ...formData, type: opt.key })}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? `${opt.color} font-semibold ring-1 ring-primary/40 shadow-2xs`
                            : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        <OptIcon className="w-3.5 h-3.5 shrink-0" />
                        <div>
                          <div className="text-[11px] leading-tight font-semibold">{opt.label}</div>
                          <div className="text-[9px] opacity-75">{opt.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Audience</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'ALL', label: 'Entire Company' },
                    { key: 'EMPLOYEE', label: 'Employees Only' },
                    { key: 'HR_MANAGER', label: 'HR Team Only' }
                  ].map(tgt => (
                    <button
                      type="button"
                      key={tgt.key}
                      onClick={() => setFormData({ ...formData, target: tgt.key })}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold text-center transition-all ${
                        formData.target === tgt.key
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                          : 'border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tgt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-Expiration Schedule */}
              <div className="space-y-1.5 p-2.5 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>Auto-Expiration</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Expires automatically</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {[
                    { key: 'never', label: 'Never' },
                    { key: '24h', label: '24h' },
                    { key: '3d', label: '3 Days' },
                    { key: '7d', label: '7 Days' },
                    { key: '30d', label: '30 Days' },
                    { key: 'custom', label: 'Custom' }
                  ].map(preset => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, expiryPreset: preset.key })}
                      className={`py-1 px-1 rounded-md text-[10px] font-semibold border transition-all text-center ${
                        formData.expiryPreset === preset.key
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                          : 'bg-card text-muted-foreground hover:text-foreground border-border/70'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {formData.expiryPreset === 'custom' && (
                  <div className="pt-1.5">
                    <Input
                      type="datetime-local"
                      className="h-7.5 text-xs"
                      value={formData.customExpiresAt}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={e => setFormData({ ...formData, customExpiresAt: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Content Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Content *</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {formData.content.length} characters
                  </span>
                </div>
                <Textarea
                  required
                  rows={4}
                  placeholder="Detail agendas, guidelines, or announcements here..."
                  className="text-xs resize-none"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-primary hover:bg-primary/90 font-semibold"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Publish Announcement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <Dialog open={Boolean(deleteTargetId)} onOpenChange={() => setDeleteTargetId(null)}>
          <DialogContent className="max-w-sm p-5">
            <DialogHeader>
              <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-1">
                <Trash2 className="w-4 h-4" />
              </div>
              <DialogTitle className="text-sm font-bold text-destructive">
                Delete Announcement
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                This will permanently remove the announcement from all employee dashboards.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTargetId(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(deleteTargetId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Read Detail Modal */}
      {selectedAnnouncement && (
        <Dialog open={Boolean(selectedAnnouncement)} onOpenChange={() => setSelectedAnnouncement(null)}>
          <DialogContent className="max-w-md p-5 sm:p-6">
            <DialogHeader>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityConfig(selectedAnnouncement.type).badge}`}>
                  {getPriorityConfig(selectedAnnouncement.type).label}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {getTargetLabel(selectedAnnouncement.target)}
                </span>
                {isAnnouncementExpired(selectedAnnouncement) && (
                  <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-rose-600">
                    EXPIRED
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-bold text-foreground leading-snug">
                {selectedAnnouncement.title}
              </DialogTitle>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-b pb-2">
                <span>Published: {format(new Date(selectedAnnouncement.createdAt), 'PPP')}</span>
                {selectedAnnouncement.author && (
                  <span className="font-semibold text-foreground">
                    By {selectedAnnouncement.author.firstName} {selectedAnnouncement.author.lastName}
                  </span>
                )}
              </div>
            </DialogHeader>

            <div className="py-2.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-[260px] overflow-y-auto custom-scrollbar">
              {selectedAnnouncement.content}
            </div>

            {selectedAnnouncement.expiresAt && (
              <div className="p-2.5 rounded-lg bg-muted/30 border text-[11px] text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Auto-Expires:
                </span>
                <strong className="text-foreground">
                  {format(new Date(selectedAnnouncement.expiresAt), 'PPP p')}
                </strong>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedAnnouncement(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
