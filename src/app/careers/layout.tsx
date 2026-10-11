"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Building2, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  LogIn, 
  Heart,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-slate-950 text-foreground selection:bg-blue-500/20 selection:text-blue-600">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
        <span>We are actively hiring across Engineering, Product, and HR teams! Explore open positions below.</span>
      </div>

      {/* Public Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-border/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/careers" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  HRMS Pro
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  Careers
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
                Enterprise Talent & Culture Portal
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
            <Link href="/careers#openings" className="hover:text-primary transition-colors">
              Open Positions
            </Link>
            <Link href="/careers#culture" className="hover:text-primary transition-colors">
              Life & Culture
            </Link>
            <Link href="/careers#benefits" className="hover:text-primary transition-colors">
              Perks & Benefits
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/login" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1.5 hidden sm:flex text-muted-foreground hover:text-foreground">
                <LogIn className="w-3.5 h-3.5" />
                <span>Employee Portal</span>
              </Button>
            </Link>
            <Link href="/careers#openings">
              <Button size="sm" className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/25">
                Explore Roles
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-border/80 bg-white dark:bg-slate-900/90 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Column 1: Brand Info */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-foreground">HRMS Pro Careers</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Empowering teams to achieve greatness through collaborative innovation, empathy, and career growth.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Multi-Tenant Hiring</span>
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Explore</h4>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium">
                <li><Link href="/careers#openings" className="hover:text-primary transition-colors">All Openings</Link></li>
                <li><Link href="/careers#culture" className="hover:text-primary transition-colors">Company Culture</Link></li>
                <li><Link href="/careers#benefits" className="hover:text-primary transition-colors">Employee Benefits</Link></li>
                <li><Link href="/careers#values" className="hover:text-primary transition-colors">Our Values</Link></li>
              </ul>
            </div>

            {/* Column 3: Applicant Support */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Applicant Privacy & Help</h4>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium">
                <li><span className="hover:text-primary cursor-pointer">Candidate Privacy Statement</span></li>
                <li><span className="hover:text-primary cursor-pointer">Equal Employment Opportunity</span></li>
                <li><span className="hover:text-primary cursor-pointer">Interview Process FAQ</span></li>
                <li><Link href="/login" className="hover:text-primary transition-colors flex items-center gap-1">Employee Login <ArrowUpRight className="w-3 h-3" /></Link></li>
              </ul>
            </div>

            {/* Column 4: Equal Opportunity Notice */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Equal Opportunity Employer</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                We are proud to be an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees. All hiring decisions are based on qualifications, merit, and business need.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} HRMS Pro Inc. All rights reserved.</p>
            <p className="flex items-center gap-1 text-[11px]">
              Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for world-class talent
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
