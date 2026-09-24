"use client";

import { useState } from 'react';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import {
  Bell,
  Search,
  Menu,
  Maximize,
  HelpCircle,
  Sun,
  Moon,
  Globe,
  User,
  Settings,
  LogOut,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import Sidebar from './Sidebar';

import { AttendancePunchWidget } from '../shared/AttendancePunchWidget';

interface NavbarProps {
  onOpenMobileSidebar?: () => void;
}

export default function Navbar({ onOpenMobileSidebar }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const { setTheme, theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between px-1.5 sm:px-6 bg-card border-b shadow-xs shrink-0 z-20 gap-1">
      {/* Left */}
      <div className="flex items-center gap-1 sm:gap-4 shrink-0 min-w-0">
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0 h-7 w-7 sm:h-9 sm:w-9 p-0" onClick={onOpenMobileSidebar} aria-label="Toggle navigation sidebar">
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="hidden sm:flex items-center text-sm text-muted-foreground gap-2 truncate">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2 truncate">
              <span className={index === breadcrumbs.length - 1 ? 'text-primary font-semibold truncate' : 'truncate'}>
                {t(crumb)}
              </span>
              {index < breadcrumbs.length - 1 && <span className="opacity-50">/</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
        <AttendancePunchWidget />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 sm:h-9 sm:w-9 shrink-0 p-0">
              <Globe className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleLanguage('en')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleLanguage('hi')}>हिंदी</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleLanguage('ar')}>العربية</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 sm:h-9 sm:w-9 shrink-0 p-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="h-3.5 w-3.5 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-3.5 w-3.5 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 sm:h-9 sm:w-9 hidden md:inline-flex shrink-0 p-0" onClick={toggleFullscreen}>
          <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <div className="h-4 sm:h-5 w-px bg-border mx-0.5 sm:mx-1 shrink-0"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-full shrink-0 p-0">
              <Avatar className="h-7 w-7 sm:h-9 sm:w-9 border">
                <AvatarImage src={user?.profilePic || ""} alt={user?.firstName || user?.email || 'User'} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[10px] sm:text-sm">
                  {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>{t('Profile')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('Logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
