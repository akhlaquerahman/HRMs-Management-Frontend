"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Calendar, 
  DollarSign, 
  Share2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Users, 
  ShieldCheck, 
  GraduationCap, 
  FileText,
  AlertCircle,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { publicApi } from '@/lib/publicApi';
import { toast } from 'sonner';

interface JobDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  responsibilities?: string;
  qualifications?: string;
  skills?: string;
  workLocation: string;
  workMode: string;
  employmentType: string;
  minExperience?: number;
  maxExperience?: number;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string;
  showSalary?: boolean;
  openings?: number;
  benefits?: string;
  deadline?: string | null;
  publishedAt?: string;
  isExpired?: boolean;
  department?: { id: string; name: string };
  company?: { name: string; website?: string; address?: string };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.get(`/careers/jobs/${slug}`);
        if (res.data?.success) {
          setJob(res.data.data);
        } else {
          setError(res.data?.message || 'Job opening not found.');
        }
      } catch (err: any) {
        console.error('Failed to load job details:', err);
        setError(err.response?.data?.message || 'Job opening not found or has been closed.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [slug]);

  const copyJobLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Job link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSalary = (min?: number | null, max?: number | null, currency = 'INR') => {
    if (!min && !max) return 'Competitive CTC (Negotiable)';
    const symbol = currency === 'INR' ? '₹' : '$';
    const formatNumber = (num: number) => {
      if (currency === 'INR' && num >= 100000) {
        return `${(num / 100000).toFixed(1)} LPA`;
      }
      return num.toLocaleString();
    };

    if (min && max) {
      return `${symbol}${formatNumber(min)} - ${symbol}${formatNumber(max)}`;
    }
    if (min) return `From ${symbol}${formatNumber(min)}`;
    return `Up to ${symbol}${formatNumber(max!)}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <div className="h-6 w-36 bg-muted rounded animate-pulse"></div>
        <div className="h-12 w-3/4 bg-muted rounded animate-pulse"></div>
        <div className="h-64 bg-muted/40 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Position Unavailable</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{error || 'This job opening is no longer open.'}</p>
        </div>
        <div>
          <Link href="/careers">
            <Button size="sm" className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to All Positions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = job.isExpired || (job.deadline ? new Date(job.deadline) < new Date() : false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <Link href="/careers" className="hover:text-primary transition-colors flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" /> Careers
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
        <span>{job.department?.name || 'Department'}</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
        <span className="text-foreground font-semibold truncate max-w-[200px]">{job.title}</span>
      </nav>

      {/* Main Job Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl border bg-card shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-800/50 px-3 py-1 rounded-full">
                {job.department?.name || 'General Operations'}
              </span>
              <Badge variant="secondary" className="text-xs font-bold">
                {job.workMode}
              </Badge>
              {isClosed ? (
                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                  Applications Closed
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300/40 text-xs">
                  Actively Recruiting
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-500" />
                {job.workLocation}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                {job.employmentType.replace('_', ' ')}
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                {job.minExperience ? `${job.minExperience} - ${job.maxExperience || (job.minExperience + 4)} yrs experience` : 'Any Experience'}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-row md:flex-col items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            {!isClosed ? (
              <Link href={`/careers/jobs/${job.slug}/apply`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-11 px-7 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 text-xs sm:text-sm gap-2">
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" disabled className="w-full h-11 px-7 text-xs sm:text-sm font-semibold">
                Applications Closed
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyJobLink}
              className="h-9 text-xs font-semibold gap-1.5 w-full sm:w-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share Role'}</span>
            </Button>
          </div>
        </div>

        {/* Highlight Pills Bar */}
        <div className="pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px] font-medium">Offered Compensation</span>
            <span className="font-extrabold text-foreground text-xs sm:text-sm mt-0.5 block">
              {formatSalary(job.minSalary, job.maxSalary, job.currency)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px] font-medium">Available Openings</span>
            <span className="font-extrabold text-foreground text-xs sm:text-sm mt-0.5 block">
              {job.openings || 1} Positions
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px] font-medium">Application Deadline</span>
            <span className="font-extrabold text-foreground text-xs sm:text-sm mt-0.5 block">
              {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Rolling Basis'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px] font-medium">Posted Date</span>
            <span className="font-extrabold text-foreground text-xs sm:text-sm mt-0.5 block">
              {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : 'Recently'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Description & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Role */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>About the Role</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <span>Key Responsibilities</span>
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line p-5 rounded-2xl bg-card border">
                {job.responsibilities}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {job.qualifications && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span>Qualifications & Experience</span>
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line p-5 rounded-2xl bg-card border">
                {job.qualifications}
              </div>
            </div>
          )}

          {/* Skills Tags */}
          {job.skills && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-violet-600" />
                <span>Required & Preferred Skills</span>
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {job.skills.split(',').map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs font-semibold py-1.5 px-3 bg-muted/40">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>Benefits & Perks</span>
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line p-5 rounded-2xl bg-card border">
                {job.benefits}
              </div>
            </div>
          )}

          {/* Bottom Apply CTA Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white space-y-4">
            <h3 className="text-xl font-bold">Sound like a great fit?</h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-xl">
              We would love to learn more about your skills and background. Submit your application online in just a couple of minutes.
            </p>
            {!isClosed && (
              <Link href={`/careers/jobs/${job.slug}/apply`}>
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs h-10 px-6 rounded-xl mt-2">
                  Apply for this Position →
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Right Sidebar: Company & Overview */}
        <div className="space-y-6">
          <Card className="border rounded-2xl shadow-xs">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{job.company?.name || 'HRMS Pro Global'}</h4>
                  <p className="text-xs text-muted-foreground">Enterprise Workforce Platform</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                We empower modern organizations with unified HR, payroll, shift management, and recruitment operations across the world.
              </p>

              <div className="pt-3 border-t space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Headquarters</span>
                  <span className="font-semibold text-foreground">{job.workLocation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Workplace Type</span>
                  <span className="font-semibold text-foreground">{job.workMode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Employment</span>
                  <span className="font-semibold text-foreground">{job.employmentType.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/careers">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> All Open Positions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
