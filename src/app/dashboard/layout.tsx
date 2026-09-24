"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, token, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push('/login');
    }
  }, [token, _hasHydrated, router]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {(!_hasHydrated || !token) && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
}
