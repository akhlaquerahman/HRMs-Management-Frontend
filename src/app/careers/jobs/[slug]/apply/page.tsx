"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Briefcase, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  Building2,
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { publicApi } from '@/lib/publicApi';
import { toast } from 'sonner';

interface JobSummary {
  id: string;
  title: string;
  slug: string;
  workLocation: string;
  workMode: string;
  department?: { name: string };
  company?: { name: string };
  isExpired?: boolean;
}

export default function JobApplyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [job, setJob] = useState<JobSummary | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [highestQualification, setHighestQualification] = useState('');
  const [college, setCollege] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentCtc, setCurrentCtc] = useState('');
  const [expectedCtc, setExpectedCtc] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('30_DAYS');
  const [skills, setSkills] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Anti-Spam & Idempotency
  const [honeypot, setHoneypot] = useState('');
  const [idempotencyToken] = useState(() => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Fetch Job Basics
  useEffect(() => {
    if (!slug) return;
    const fetchJob = async () => {
      try {
        setLoadingJob(true);
        const res = await publicApi.get(`/careers/jobs/${slug}`);
        if (res.data?.success) {
          setJob(res.data.data);
        } else {
          setErrorMessage('Job opening is not currently available.');
        }
      } catch (err: any) {
        setErrorMessage('Unable to load job information.');
      } finally {
        setLoadingJob(false);
      }
    };
    fetchJob();
  }, [slug]);

  // Handle File Select
  const handleFileChange = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setResumeFile(null);
      return;
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext || '')) {
      setFileError('Invalid file format. Only PDF and DOCX files are accepted.');
      return;
    }

    setResumeFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please provide both first and last name.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please provide a valid phone number.');
      return;
    }

    if (!resumeFile) {
      setErrorMessage('Please upload your resume in PDF or DOCX format.');
      return;
    }

    if (!privacyConsent) {
      setErrorMessage('You must acknowledge and agree to the candidate privacy policy to proceed.');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('currentLocation', currentLocation.trim());
      formData.append('highestQualification', highestQualification.trim());
      formData.append('college', college.trim());
      formData.append('experienceYears', experienceYears);
      formData.append('currentCompany', currentCompany.trim());
      formData.append('currentCtc', currentCtc.trim());
      formData.append('expectedCtc', expectedCtc.trim());
      formData.append('noticePeriod', noticePeriod);
      formData.append('skills', skills.trim());
      formData.append('linkedInUrl', linkedInUrl.trim());
      formData.append('githubUrl', githubUrl.trim());
      formData.append('portfolioUrl', portfolioUrl.trim());
      formData.append('coverLetter', coverLetter.trim());
      formData.append('privacyConsent', 'true');
      formData.append('honeypot', honeypot);
      formData.append('idempotencyToken', idempotencyToken);
      formData.append('resume', resumeFile);

      const res = await publicApi.post(`/careers/jobs/${slug}/apply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-idempotency-key': idempotencyToken
        }
      });

      if (res.data?.success) {
        toast.success('Application submitted successfully!');
        const appData = res.data.data;
        const queryParams = new URLSearchParams({
          appRef: appData.applicationNumber,
          role: appData.jobTitle || job?.title || 'Selected Role',
          email: appData.candidateEmail || email.trim()
        }).toString();

        router.push(`/careers/application-success?${queryParams}`);
      } else {
        setErrorMessage(res.data?.message || 'Failed to submit application.');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      const serverMsg = err.response?.data?.message;
      setErrorMessage(serverMsg || 'An error occurred while submitting your application. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-muted-foreground font-medium">Preparing application portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2">
            <Link href="/careers" className="hover:text-primary transition-colors">Careers</Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <Link href={`/careers/jobs/${slug}`} className="hover:text-primary transition-colors truncate max-w-[200px]">
              {job?.title || 'Job Details'}
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">Apply</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Apply for {job?.title}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {job?.company?.name || 'HRMS Pro'} • {job?.workLocation} ({job?.workMode})
          </p>
        </div>

        <Link href={`/careers/jobs/${slug}`}>
          <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 h-9">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Role Description
          </Button>
        </Link>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Anti-Spam Honeypot (Hidden) */}
        <input 
          type="text" 
          value={honeypot} 
          onChange={(e) => setHoneypot(e.target.value)} 
          className="hidden" 
          tabIndex={-1} 
          autoComplete="off" 
        />

        {/* SECTION 1: PERSONAL INFORMATION */}
        <Card className="border rounded-2xl shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-extrabold flex items-center justify-center">1</span>
              <span>Personal & Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">First Name *</Label>
                <Input 
                  placeholder="e.g. Aryan" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  required 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Last Name *</Label>
                <Input 
                  placeholder="e.g. Sharma" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  required 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Email Address *</Label>
                <Input 
                  type="email" 
                  placeholder="e.g. aryan.sharma@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="h-10 text-xs" 
                />
                <span className="text-[10px] text-muted-foreground">We will send confirmation and interview updates here.</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Phone Number *</Label>
                <Input 
                  placeholder="e.g. +91 98765 43210" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-foreground">Current Location / City</Label>
                <Input 
                  placeholder="e.g. Noida, Uttar Pradesh, India" 
                  value={currentLocation} 
                  onChange={(e) => setCurrentLocation(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: EXPERIENCE & EDUCATION */}
        <Card className="border rounded-2xl shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-extrabold flex items-center justify-center">2</span>
              <span>Experience & Professional Background</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Total Experience (Years)</Label>
                <Input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  placeholder="e.g. 4.5" 
                  value={experienceYears} 
                  onChange={(e) => setExperienceYears(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Current Company / Employer</Label>
                <Input 
                  placeholder="e.g. Tech Innovators Corp" 
                  value={currentCompany} 
                  onChange={(e) => setCurrentCompany(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Highest Qualification</Label>
                <Input 
                  placeholder="e.g. B.Tech Computer Science / MCA" 
                  value={highestQualification} 
                  onChange={(e) => setHighestQualification(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">College / University</Label>
                <Input 
                  placeholder="e.g. IIT Delhi / Delhi University" 
                  value={college} 
                  onChange={(e) => setCollege(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Current Annual CTC (INR / USD)</Label>
                <Input 
                  placeholder="e.g. ₹15,00,000" 
                  value={currentCtc} 
                  onChange={(e) => setCurrentCtc(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Expected Annual CTC (INR / USD)</Label>
                <Input 
                  placeholder="e.g. ₹22,00,000" 
                  value={expectedCtc} 
                  onChange={(e) => setExpectedCtc(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Notice Period</Label>
                <select
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-xs font-medium text-foreground focus:outline-none"
                >
                  <option value="IMMEDIATE">Immediate Joiner (0 days)</option>
                  <option value="15_DAYS">15 Days</option>
                  <option value="30_DAYS">30 Days (1 Month)</option>
                  <option value="60_DAYS">60 Days (2 Months)</option>
                  <option value="90_DAYS">90 Days (3 Months)</option>
                  <option value="SERVING_NOTICE">Serving Notice Period</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Key Skills</Label>
                <Input 
                  placeholder="e.g. React, Node.js, Next.js, PostgreSQL" 
                  value={skills} 
                  onChange={(e) => setSkills(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: SOCIAL & ONLINE PROFILES */}
        <Card className="border rounded-2xl shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-extrabold flex items-center justify-center">3</span>
              <span>Online Profiles & Links (Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">LinkedIn URL</Label>
                <Input 
                  placeholder="https://linkedin.com/in/username" 
                  value={linkedInUrl} 
                  onChange={(e) => setLinkedInUrl(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">GitHub URL</Label>
                <Input 
                  placeholder="https://github.com/username" 
                  value={githubUrl} 
                  onChange={(e) => setGithubUrl(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Portfolio / Personal Site</Label>
                <Input 
                  placeholder="https://yourportfolio.dev" 
                  value={portfolioUrl} 
                  onChange={(e) => setPortfolioUrl(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-bold text-foreground">Cover Letter / Note for Hiring Team</Label>
              <Textarea 
                placeholder="Briefly introduce yourself and why you are excited to join us for this role..." 
                value={coverLetter} 
                onChange={(e) => setCoverLetter(e.target.value)} 
                rows={4} 
                className="text-xs resize-none" 
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: RESUME UPLOAD */}
        <Card className="border rounded-2xl shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-extrabold flex items-center justify-center">4</span>
              <span>Upload Resume / CV *</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer bg-muted/10 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all space-y-3"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)} 
                accept=".pdf,.docx,.doc" 
                className="hidden" 
              />
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-bold text-foreground">Click to upload or drag and drop your resume</p>
                <p className="text-xs text-muted-foreground mt-0.5">Supported formats: PDF, DOCX (Maximum file size: 5MB)</p>
              </div>
            </div>

            {/* Selected File Feedback */}
            {resumeFile && (
              <div className="p-3 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-bold text-foreground block">{resumeFile.name}</span>
                    <span className="text-[10px] text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setResumeFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-destructive font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {fileError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* SECTION 5: PRIVACY CONSENT & SUBMIT */}
        <div className="p-6 rounded-2xl border bg-card shadow-xs space-y-5">
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="privacy" 
              checked={privacyConsent} 
              onChange={(e) => setPrivacyConsent(e.target.checked)} 
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
              required 
            />
            <label htmlFor="privacy" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
              <strong className="text-foreground">Candidate Data Privacy Consent:</strong> I agree that my submitted information and resume may be securely processed and stored by {job?.company?.name || 'HRMS Pro'} for recruitment, evaluation, and future employment opportunities in accordance with applicable data protection regulations.
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>256-Bit SSL Encrypted Submission</span>
            </div>

            <Button 
              type="submit" 
              disabled={submitting} 
              className="w-full sm:w-auto h-11 px-8 font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md text-xs sm:text-sm gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
