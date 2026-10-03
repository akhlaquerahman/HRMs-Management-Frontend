"use client";

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getRolePagePermissions, fetchAndSyncRolePagePermissions, extractRoleName } from '@/lib/pagePermissions';
import {
  LayoutDashboard,
  Users,
  Building,
  Briefcase,
  CalendarCheck,
  Clock,
  CalendarDays,
  FileText,
  DollarSign,
  Receipt,
  Gift,
  TrendingDown,
  UserPlus,
  Video,
  Target,
  BarChart,
  FileBadge,
  Files,
  Settings,
  Shield,
  Search,
  Menu,
  User,
  FolderOpen,
  Loader2,
  Building2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

type MenuItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

const menuConfig: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Organization',
    href: '/dashboard/organization',
    icon: Building2,
  },
  {
    title: 'Employee Management',
    href: '/dashboard/employee-management',
    icon: Users,
  },
  {
    title: 'Attendance',
    href: '/dashboard/attendance',
    icon: Clock,
  },
  {
    title: 'Shift Management',
    href: '/dashboard/shift-management',
    icon: CalendarDays,
  },
  {
    title: 'Leave Management',
    href: '/dashboard/leave-management',
    icon: CalendarCheck,
  },
  {
    title: 'Payroll',
    href: '/dashboard/payroll',
    icon: DollarSign,
  },
  {
    title: 'Recruitment',
    href: '/dashboard/recruitment',
    icon: UserPlus,
  },
  {
    title: 'Documents',
    href: '/dashboard/documents',
    icon: FolderOpen,
  },
  {
    title: 'My Attendance',
    href: '/dashboard/my-attendance',
    icon: Clock,
  },
  {
    title: 'Leave Request',
    href: '/dashboard/leave-request',
    icon: CalendarCheck,
  },
  {
    title: 'Payslips',
    href: '/dashboard/payslips',
    icon: FileText,
  },
  {
    title: 'My Documents',
    href: '/dashboard/my-documents',
    icon: FolderOpen,
  },
  {
    title: 'Tenant Employees',
    href: '/dashboard/tenant-employees',
    icon: Building,
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'Roles',
    href: '/dashboard/roles',
    icon: Settings,
  },

  {
    title: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: Shield,
  },
  {
    title: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
];



interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    setPendingRoute(null);
    if (onClose) onClose();
  }, [pathname]);

  // Handle Escape key and Body Scroll Lock on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onClose) {
        onClose();
      }
    };

    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen, onClose]);

  // Dynamic Page Permissions & Role Filtering
  const roleNameRaw = extractRoleName(user?.role);
  const normalizedRole = roleNameRaw.toUpperCase().trim().replace(/[\s\_]+/g, '_');
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'SUPER_ADMINISTRATOR';
  const isHrAdmin = normalizedRole.includes('HR') || normalizedRole === 'HR_MANAGER' || normalizedRole === 'HR_ADMIN';

  const [allowedPages, setAllowedPages] = useState<string[]>([]);

  useEffect(() => {
    const syncPermissions = () => {
      const perms = getRolePagePermissions(user?.role);
      setAllowedPages(perms);
    };
    syncPermissions();
    fetchAndSyncRolePagePermissions();
    const interval = setInterval(fetchAndSyncRolePagePermissions, 3000);

    if (typeof window !== 'undefined') {
      window.addEventListener('hrms_permissions_updated', syncPermissions);
      window.addEventListener('storage', syncPermissions);
    }
    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('hrms_permissions_updated', syncPermissions);
        window.removeEventListener('storage', syncPermissions);
      }
    };
  }, [user?.role]);
  
  const filteredLinks = menuConfig.filter(link => {
    const superAdminOnlyRoutes = [
      '/dashboard/tenant-employees',
      '/dashboard/users',
      '/dashboard/roles',
      '/dashboard/audit-logs'
    ];

    // Non-Super Admin users MUST NEVER see Super Admin only links
    if (!isSuperAdmin && superAdminOnlyRoutes.includes(link.href)) {
      return false;
    }

    // Dedicated clean Admin sidebar for Super Admin
    if (isSuperAdmin) {
      const superAdminPages = [
        '/dashboard',
        '/dashboard/tenant-employees',
        '/dashboard/my-attendance',
        '/dashboard/users',
        '/dashboard/roles',
        '/dashboard/audit-logs',
        '/dashboard/profile'
      ];
      return superAdminPages.includes(link.href);
    }

    // Dynamic permission check for all other roles (HR_MANAGER, HR_ADMIN, EMPLOYEE, etc.)
    return allowedPages.includes(link.href);
  });

  const displayLinks = filteredLinks.filter((link) =>
    t(link.title).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card">
      <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
        <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-primary">
          <Image
            src="/hrms-logo.png"
            alt="HRMS Logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain rounded-md"
          />
          <span>HRMS Pro</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted focus:outline-none"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="p-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("Search...")} 
            className="pl-8 bg-muted/50" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        <nav className="space-y-1">
          {displayLinks.map((item) => {
            const isCurrent = pathname === item.href;
            const isPending = pendingRoute === item.href;
            const isActive = isCurrent || isPending;
            const isOtherPending = pendingRoute !== null && !isPending;

            return (
              <Link 
                key={item.title} 
                href={item.href}
                onClick={(e) => {
                  if (pendingRoute) {
                    e.preventDefault();
                    return;
                  }
                  if (!isCurrent) {
                    setPendingRoute(item.href);
                  }
                  if (onClose) onClose();
                }}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
                  isActive ? "bg-accent text-primary font-semibold shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isOtherPending && "opacity-50 pointer-events-none"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <item.icon className={cn("h-4 w-4 shrink-0", isPending && "text-primary/70")} />
                  <span className="truncate">{t(item.title)}</span>
                </div>
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t shrink-0 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 text-primary font-extrabold flex items-center justify-center shrink-0 shadow-xs border border-primary/20">
            {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex flex-col truncate min-w-0 flex-1">
            <span className="text-sm font-bold truncate text-foreground" title={user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.email ? user.email.split('@')[0] : 'User')}
            </span>
            <span className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider truncate" title={user?.email}>
              {user?.role ? user.role.replace(/_/g, ' ') : 'SUPER ADMIN'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on screens smaller than lg) */}
      <aside className="hidden lg:flex w-64 border-r bg-card flex-col h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible on screens smaller than lg when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-over Content Drawer */}
          <div className="relative w-72 max-w-[80vw] bg-card h-full shadow-2xl z-10 flex flex-col transition-transform duration-300 animate-in slide-in-from-left-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
