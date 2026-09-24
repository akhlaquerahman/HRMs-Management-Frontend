"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Calendar, Plus, Trash2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  target?: string;
  createdAt: string;
  author?: { firstName: string; lastName: string; companyName?: string };
}

interface CompanyAnnouncementsProps {
  announcements?: Announcement[];
  loading?: boolean;
}

export function CompanyAnnouncements({ announcements: initialData, loading: initialLoading }: CompanyAnnouncementsProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO',
    target: 'ALL'
  });
  const [errorMsg, setErrorMsg] = useState('');

  const rawRole = typeof user?.role === 'string' ? user.role.toUpperCase().trim().replace(/\s+/g, '_') : '';
  const isHRAdmin = ['HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(rawRole);

  // Fetch announcements with company isolation & dual-endpoint fallback
  const { data: announcements = initialData || [], isLoading } = useQuery({
    queryKey: ['company_announcements'],
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

  // Create Announcement Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const res = await api.post('/announcements', data);
        return res.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallbackRes = await api.post('/dashboard/announcements', data);
          return fallbackRes.data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setIsModalOpen(false);
      setFormData({ title: '', content: '', type: 'INFO', target: 'ALL' });
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to create announcement');
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
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setErrorMsg('Please enter both title and announcement content');
      return;
    }
    createMutation.mutate(formData);
  };

  const badgeStyle = (type: string) => {
    switch (type) {
      case 'URGENT':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'SUCCESS':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800';
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          {t('Company Announcements')}
        </h3>

        {/* HR Admin Only Create Button */}
        {isHRAdmin && (
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-1 px-2.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px] pr-1 custom-scrollbar flex-1">
        {isLoading || initialLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/20 animate-pulse border">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-full mt-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          ))
        ) : announcements?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground h-full">
            <Megaphone className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">{t('No active announcements.')}</p>
            {isHRAdmin && (
              <p className="text-xs text-muted-foreground mt-1">
                Click "+ Create" above to publish a new announcement to your company.
              </p>
            )}
          </div>
        ) : (
          announcements?.map((announcement: Announcement) => (
            <div
              key={announcement.id}
              className="group flex flex-col gap-2 p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors relative"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-semibold text-xs leading-snug text-foreground">
                  {announcement.title}
                </h4>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle(announcement.type)}`}>
                    {announcement.type || 'INFO'}
                  </span>

                  {/* Delete button for HR Admins */}
                  {isHRAdmin && (
                    <button
                      onClick={() => deleteMutation.mutate(announcement.id)}
                      disabled={deleteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-rose-600 rounded"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {announcement.content}
              </p>

              <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground border-t pt-2 border-muted/50">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span>{format(new Date(announcement.createdAt), 'MMM dd, yyyy')}</span>
                </div>

                {announcement.author && (
                  <span className="font-medium text-foreground text-[10px]">
                    {announcement.author.firstName} {announcement.author.lastName}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* HR Admin Create Announcement Modal */}
      {isHRAdmin && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
                <Megaphone className="w-5 h-5 text-primary" />
                Publish Company Announcement
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-2">
              {errorMsg && (
                <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Announcement Title *</Label>
                <Input
                  required
                  placeholder="e.g. Annual Company Offsite 2026 Announcement"
                  className="h-9 text-xs"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Priority Level *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="INFO">INFO (General)</option>
                    <option value="URGENT">URGENT (Critical)</option>
                    <option value="WARNING">WARNING (Alert)</option>
                    <option value="SUCCESS">SUCCESS (Event/Good News)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Target Audience *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: e.target.value })}
                  >
                    <option value="ALL">Entire Company (ALL)</option>
                    <option value="EMPLOYEE">Employees Only</option>
                    <option value="HR_MANAGER">HR Managers Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Announcement Content *</Label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Write details of the company announcement here..."
                  className="text-xs resize-none"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Publish Announcement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
