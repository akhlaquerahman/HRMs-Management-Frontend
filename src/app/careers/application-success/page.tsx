"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Briefcase, 
  ArrowRight, 
  Calendar, 
  Mail, 
  ShieldCheck, 
  Sparkles,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

function ApplicationSuccessContent() {
  const searchParams = useSearchParams();
  const appRef = searchParams.get('appRef') || 'APP-2026-CONFIRMED';
  const role = searchParams.get('role') || 'Software Engineer';
  const email = searchParams.get('email') || 'candidate@example.com';

  const [copied, setCopied] = useState(false);

  const copyRef = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(appRef);
      setCopied(true);
      toast.success('Application reference copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8">
      {/* Success Animation Circle */}
      <div className="relative inline-block">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 border-4 border-white dark:border-slate-900">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 animate-in zoom-in-75 duration-300" />
        </div>
        <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
      </div>

      {/* Main Headline */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          Application Submitted!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Thank you for applying. We have received your application for <strong className="text-foreground">{role}</strong>. A confirmation email has been dispatched to <strong className="text-foreground">{email}</strong>.
        </p>
      </div>

      {/* Reference ID Card */}
      <Card className="border rounded-2xl shadow-xs bg-card/80 backdrop-blur-xs max-w-md mx-auto">
        <CardContent className="p-5 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Your Application Reference
          </span>

          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-blue-600 dark:text-blue-400">
              {appRef}
            </span>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={copyRef} 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Copy Reference"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Please retain this reference code for future communications with our recruitment team.
          </p>
        </CardContent>
      </Card>

      {/* What Happens Next Card */}
      <div className="p-6 rounded-2xl border bg-muted/20 text-left space-y-4 max-w-lg mx-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span>Next Steps in Our Process</span>
        </h3>

        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              1
            </div>
            <div>
              <strong className="text-foreground block">Application Review (1-3 business days)</strong>
              Our hiring managers and talent partners evaluate your credentials and portfolio.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              2
            </div>
            <div>
              <strong className="text-foreground block">Introductory Video Screening</strong>
              Short conversation to explore role alignment, team goals, and expectations.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              3
            </div>
            <div>
              <strong className="text-foreground block">Technical & Architecture Deep Dive</strong>
              Collaborative discussion with domain experts on real-world engineering scenarios.
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/careers">
          <Button size="lg" className="w-full sm:w-auto h-11 px-7 font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs sm:text-sm">
            <Briefcase className="w-4 h-4" />
            <span>Explore More Openings</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ApplicationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto py-24 text-center">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <ApplicationSuccessContent />
    </Suspense>
  );
}
