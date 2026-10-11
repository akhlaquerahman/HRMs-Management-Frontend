"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Clock, 
  Building2, 
  DollarSign, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Laptop, 
  GraduationCap, 
  Calendar, 
  Filter,
  Users,
  Compass,
  HeartHandshake,
  Zap,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { publicApi } from '@/lib/publicApi';

interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
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
  skills?: string;
  benefits?: string;
  deadline?: string | null;
  publishedAt?: string;
  department?: { id: string; name: string };
  company?: { name: string; website?: string };
}

interface Department {
  id: string;
  name: string;
  _count?: { jobRoles: number };
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch Jobs & Departments
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobsRes, deptsRes] = await Promise.all([
        publicApi.get('/careers/jobs?limit=50'),
        publicApi.get('/careers/departments')
      ]);

      if (jobsRes.data?.success) {
        setJobs(jobsRes.data.data.jobs || []);
      }
      if (deptsRes.data?.success) {
        setDepartments(deptsRes.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load careers:', err);
      setError('Unable to load job openings right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        job.title.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q) ||
        job.skills?.toLowerCase().includes(q) ||
        job.workLocation?.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'ALL' || job.department?.id === selectedDept;
      const matchesMode = selectedMode === 'ALL' || job.workMode === selectedMode;
      const matchesType = selectedType === 'ALL' || job.employmentType === selectedType;

      return matchesSearch && matchesDept && matchesMode && matchesType;
    });
  }, [jobs, searchTerm, selectedDept, selectedMode, selectedType]);

  // Paginated Jobs
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setSelectedMode('ALL');
    setSelectedType('ALL');
    setCurrentPage(1);
  };

  const formatSalary = (min?: number | null, max?: number | null, currency = 'INR') => {
    if (!min && !max) return 'Competitive CTC';
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

  return (
    <div className="space-y-20 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-blue-50/70 via-white to-transparent dark:from-slate-900/60 dark:via-slate-950 dark:to-transparent border-b border-border/50">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Join Our Mission • Shaping Future Workforce Excellence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
            Build The Future of Enterprise Work <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              With Passion & Purpose
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground font-medium leading-relaxed">
            We are solving mission-critical workforce challenges for thousands of enterprises worldwide. Discover your next career breakthrough in an empowering, high-growth environment.
          </p>

          {/* Hero Quick Search Box */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="p-2 sm:p-2.5 rounded-2xl border bg-card/90 backdrop-blur-md shadow-lg shadow-blue-500/5 flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search job title, skills, or keywords..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-11 border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                />
              </div>
              <Button 
                onClick={() => {
                  const openingsEl = document.getElementById('openings');
                  openingsEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
              >
                Browse Openings
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 pt-5 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Remote & Hybrid Flexibility
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Transparent Compensation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Rapid Career Growth
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* OPEN POSITIONS EXPLORER */}
      <section id="openings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Briefcase className="w-4 h-4" />
              <span>Current Opportunities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              Explore Available Positions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'} currently accepting applications.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-bold py-1 px-3 bg-muted/30">
              {jobs.length} Total Openings
            </Badge>
            <Badge variant="outline" className="text-xs font-bold py-1 px-3 bg-muted/30">
              {departments.length} Departments
            </Badge>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by role or skill..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10 text-xs bg-background"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-lg border bg-background text-xs font-medium text-foreground focus:outline-none min-w-[150px]"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Work Mode Filter */}
          <select
            value={selectedMode}
            onChange={(e) => {
              setSelectedMode(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-lg border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="ALL">All Work Modes</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </select>

          {/* Employment Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-lg border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="ALL">All Job Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>

          {(searchTerm || selectedDept !== 'ALL' || selectedMode !== 'ALL' || selectedType !== 'ALL') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="h-10 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-2xl border bg-card animate-pulse space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 bg-muted rounded"></div>
                    <div className="h-6 w-3/4 bg-muted rounded"></div>
                  </div>
                  <div className="h-8 w-20 bg-muted rounded"></div>
                </div>
                <div className="h-12 bg-muted/60 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-muted rounded-full"></div>
                  <div className="h-6 w-16 bg-muted rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="p-8 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchData} className="gap-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </Button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="p-12 rounded-3xl border bg-card/60 text-center space-y-4 max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">No matching openings found</h3>
              <p className="text-xs text-muted-foreground">
                We could not find any active job openings matching your current filter criteria.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={resetFilters} className="text-xs font-semibold">
              Clear All Filters
            </Button>
          </div>
        )}

        {/* JOB CARDS LIST */}
        {!loading && !error && paginatedJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedJobs.map((job) => (
              <Card 
                key={job.id} 
                className="group border border-border/70 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 rounded-2xl overflow-hidden bg-card flex flex-col justify-between"
              >
                <CardHeader className="pb-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-800/50 px-2.5 py-1 rounded-full">
                      {job.department?.name || 'General Operations'}
                    </span>
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      {job.workMode}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Job Details Pills */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.workLocation || 'Headquarters'}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {job.employmentType.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {job.minExperience ? `${job.minExperience}+ yrs exp` : 'Entry / Any Exp'}
                    </span>
                  </div>

                  {/* Salary & Openings */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-medium">Compensation</span>
                      <span className="text-xs font-extrabold text-foreground">
                        {formatSalary(job.minSalary, job.maxSalary, job.currency)}
                      </span>
                    </div>
                    {job.openings && job.openings > 1 && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300/40 text-[11px]">
                        {job.openings} Openings
                      </Badge>
                    )}
                  </div>

                  {/* Skills tags if available */}
                  {job.skills && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {job.skills.split(',').slice(0, 4).map((skill, sIdx) => (
                        <span key={sIdx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {skill.trim()}
                        </span>
                      ))}
                      {job.skills.split(',').length > 4 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{job.skills.split(',').length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Link */}
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {job.deadline ? `Deadline: ${new Date(job.deadline).toLocaleDateString()}` : 'Applications Open'}
                    </span>
                    <Link href={`/careers/jobs/${job.slug}`}>
                      <Button size="sm" className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-xs">
                        <span>View & Apply</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {filteredJobs.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs font-semibold"
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground font-medium px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs font-semibold"
            >
              Next
            </Button>
          </div>
        )}
      </section>

      {/* LIFE & CULTURE SECTION */}
      <section id="culture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Life At HRMS Pro
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Our Core Culture & Values
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We don't just build software — we create an environment where exceptional people can thrive, take ownership, and lead fulfilling careers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border shadow-xs hover:border-blue-500/40 transition-colors rounded-2xl">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">High Impact & Autonomy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Take full ownership of your domain. We trust our teams with significant responsibilities and give them the space to make real decisions.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs hover:border-blue-500/40 transition-colors rounded-2xl">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">Work-Life Harmony</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Flexible hybrid policies, sensible working hours, and respect for personal time. We measure results, not time spent sitting at a desk.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs hover:border-blue-500/40 transition-colors rounded-2xl">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">Continuous Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generous annual stipends for books, conferences, technical certifications, and dedicated weekly learning sessions.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs hover:border-blue-500/40 transition-colors rounded-2xl">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">Inclusion & Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An open culture where leadership share regular updates, compensation bands are fair, and diverse viewpoints are genuinely valued.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* PERKS & BENEFITS SECTION */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Total Rewards
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Perks & Benefits Designed For You
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We provide competitive packages and comprehensive care to support you and your family at every stage of life.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border bg-card/60 space-y-2.5">
            <div className="text-blue-600 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Comprehensive Healthcare
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Full medical, accident, and life insurance coverage covering you, your spouse, children, and parents.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card/60 space-y-2.5">
            <div className="text-indigo-600 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Ergonomic Workstation
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Modern high-spec laptops, 4K monitors, and an annual home-office stipend for comfortable ergonomics.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card/60 space-y-2.5">
            <div className="text-violet-600 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Generous Time Off
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paid vacation, festival holidays, mental health wellness days, and comprehensive parental leave.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card/60 space-y-2.5">
            <div className="text-emerald-600 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Performance Incentives
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Transparent milestone bonuses, appraisal cycles twice a year, and long-term equity stock options.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card/60 space-y-2.5">
            <div className="text-amber-600 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Professional Development
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sponsored courses, subscriptions, attendance at top global conferences, and internal engineering hackathons.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card/60 space-y-2.5">
            <div className="text-rose-600 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Team Retreats & Socials
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Annual team offsites, catered team lunches, holiday parties, and engaging casual game days.
            </p>
          </div>
        </div>
      </section>

      {/* HIRING PROCESS TIMELINE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Transparent Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            What To Expect In Our Interview Process
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="p-5 rounded-2xl border bg-card text-center space-y-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center mx-auto">
              1
            </div>
            <h4 className="text-xs font-bold text-foreground">Submit Application</h4>
            <p className="text-[11px] text-muted-foreground">Upload your resume and details in under 2 minutes.</p>
          </div>

          <div className="p-5 rounded-2xl border bg-card text-center space-y-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center mx-auto">
              2
            </div>
            <h4 className="text-xs font-bold text-foreground">Profile Screening</h4>
            <p className="text-[11px] text-muted-foreground">Recruiter call (20 mins) to discuss experience and fit.</p>
          </div>

          <div className="p-5 rounded-2xl border bg-card text-center space-y-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center mx-auto">
              3
            </div>
            <h4 className="text-xs font-bold text-foreground">Skills & Architecture</h4>
            <p className="text-[11px] text-muted-foreground">Deep dive discussion with team leads and peers.</p>
          </div>

          <div className="p-5 rounded-2xl border bg-card text-center space-y-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center mx-auto">
              4
            </div>
            <h4 className="text-xs font-bold text-foreground">Offer & Welcome</h4>
            <p className="text-[11px] text-muted-foreground">Transparent offer proposal, negotiation, and smooth onboarding.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-12 text-white text-center space-y-6 shadow-xl shadow-blue-500/10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Take The Next Step in Your Career?
          </h2>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-blue-100 font-medium">
            Explore our open positions today and join an ambitious team dedicated to building enterprise software that matters.
          </p>
          <div>
            <Button 
              size="lg"
              onClick={() => {
                const openingsEl = document.getElementById('openings');
                openingsEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs h-11 px-8 rounded-xl shadow-md"
            >
              View All Open Positions
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
