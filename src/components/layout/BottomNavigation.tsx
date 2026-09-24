"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  FileText,
  Users,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  onOpenMore?: () => void;
}

export default function BottomNavigation({ onOpenMore }: BottomNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const userRole = user?.role?.toUpperCase() || '';
  const isHR = userRole === 'HR_ADMIN' || userRole === 'HR ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPER ADMIN';

  // Role-specific bottom tabs (5 primary tabs)
  const employeeTabs = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/dashboard/my-attendance', icon: Clock },
    { label: 'Leave', href: '/dashboard/leave-request', icon: CalendarCheck },
    { label: 'Payslips', href: '/dashboard/payslips', icon: FileText },
    { label: 'Documents', href: '/dashboard/my-documents', icon: FolderOpen },
  ];

  const hrTabs = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Employees', href: '/dashboard/employee-management', icon: Users },
    { label: 'Attendance', href: '/dashboard/attendance', icon: Clock },
    { label: 'Leave', href: '/dashboard/leave-management', icon: CalendarCheck },
    { label: 'Documents', href: '/dashboard/documents', icon: FolderOpen },
  ];


  const primaryTabs = isHR ? hrTabs : employeeTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg lg:hidden h-16 px-1 flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all rounded-xl text-center active:scale-95",
              isActive 
                ? "text-primary font-bold" 
                : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            <div className={cn("p-1 rounded-lg transition-colors", isActive && "bg-primary/10 text-primary")}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] tracking-tight truncate w-full mt-0.5">
              {t(tab.label)}
            </span>
            {isActive && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
          </Link>
        );
      })}
    </div>
  );
}

