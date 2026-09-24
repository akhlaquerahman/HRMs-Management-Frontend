"use client";

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
            {children}
          </div>
        </main>
        <BottomNavigation onOpenMore={() => setIsMobileSidebarOpen(true)} />
      </div>
    </div>
  );
}

