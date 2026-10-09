"use client";

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import { useAuthStore } from '@/store/authStore';
import { usePathname } from 'next/navigation';
import { getRolePagePermissions, fetchAndSyncRolePagePermissions, extractRoleName } from '@/lib/pagePermissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [allowedPages, setAllowedPages] = useState<string[]>([]);

  useEffect(() => {
    const syncPermissions = () => {
      const perms = getRolePagePermissions(user?.role);
      setAllowedPages(perms);
    };
    syncPermissions();
    fetchAndSyncRolePagePermissions();

    if (typeof window !== 'undefined') {
      window.addEventListener('hrms_permissions_updated', syncPermissions);
      window.addEventListener('storage', syncPermissions);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hrms_permissions_updated', syncPermissions);
        window.removeEventListener('storage', syncPermissions);
      }
    };
  }, [user?.role]);

  const roleNameRaw = extractRoleName(user?.role);
  const normalizedRole = roleNameRaw.toUpperCase().trim().replace(/[\s\_]+/g, '_');
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'SUPER_ADMINISTRATOR';

  const superAdminOnlyRoutes = [
    '/dashboard/tenant-employees',
    '/dashboard/users',
    '/dashboard/roles',
    '/dashboard/audit-logs'
  ];

  const isAccessDenied = !isSuperAdmin && (
    superAdminOnlyRoutes.includes(pathname) ||
    (allowedPages.length > 0 && !allowedPages.includes(pathname) && pathname !== '/dashboard' && pathname !== '/dashboard/profile')
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="flex flex-col flex-1 overflow-hidden relative w-full min-w-0">
        <Navbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 lg:pb-6 bg-muted/20 custom-scrollbar">
          <div className="mx-auto max-w-[1600px] w-full min-w-0">
            {isAccessDenied ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border rounded-2xl shadow-sm">
                <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 mb-4">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2">Page Access Restricted</h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Super Admin has restricted access to this page for your role. Contact your system administrator if you require access to this section.
                </p>
                <Button asChild className="bg-primary hover:bg-primary/90 gap-2">
                  <Link href="/dashboard">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
        <BottomNavigation onOpenMore={() => setIsMobileSidebarOpen(true)} />
      </div>
    </div>
  );
}

