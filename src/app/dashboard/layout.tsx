"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {(!mounted || !token) && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
}
