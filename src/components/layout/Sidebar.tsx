"use client";

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
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
    title: 'Organization Setup',
    href: '/dashboard/org-setup',
    icon: Building,
  },
  {
    title: 'Attendance',
    href: '/dashboard/attendance',
    icon: Clock,
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

  // Filter links based on role
  const userRole = user?.role?.toUpperCase() || '';
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'SUPER ADMIN';
  const isHrAdmin = userRole === 'HR_ADMIN' || userRole === 'HR ADMIN';
  
  const filteredLinks = menuConfig.filter(link => {
    const adminOnlyLinks = ['/dashboard/users', '/dashboard/roles', '/dashboard/audit-logs'];
    const hrOnlyLinks = [
      '/dashboard/organization',
      '/dashboard/employee-management', 
      '/dashboard/org-setup',
      '/dashboard/attendance', 
      '/dashboard/leave-management', 
      '/dashboard/payroll', 
      '/dashboard/recruitment', 
      '/dashboard/documents'
    ];
    const employeeOnlyLinks = [
      '/dashboard/my-attendance',
      '/dashboard/leave-request',
      '/dashboard/payslips',
      '/dashboard/my-documents'
    ];
    
    if (adminOnlyLinks.includes(link.href)) return isSuperAdmin;
    if (hrOnlyLinks.includes(link.href)) return isHrAdmin;
    if (link.href === '/dashboard/my-attendance') return true;
    if (employeeOnlyLinks.includes(link.href)) return userRole === 'EMPLOYEE';
    
    return true;
  });

  const displayLinks = filteredLinks.filter((link) =>
    t(link.title).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card">
      <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <Briefcase className="h-6 w-6" />
          HRMS Pro
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
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
            {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium truncate">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.role}</span>
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
