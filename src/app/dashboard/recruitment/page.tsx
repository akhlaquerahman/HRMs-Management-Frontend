"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  Eye,
  Edit,
  Briefcase,
  FileText,
  Search,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  BarChart3,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Download,
  Building2,
  Calendar,
  Globe,
  ExternalLink,
  History,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];

export default function RecruitmentPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("candidates");
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewCandidate, setViewCandidate] = useState<any>(null);
  const [editCandidate, setEditCandidate] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobRoleId: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const initialRoleData = {
    title: "",
    description: "",
    departmentId: "",
    workLocation: "Headquarters",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    minExperience: 2,
    maxExperience: 5,
    minSalary: 800000,
    maxSalary: 1600000,
    openings: 1,
    skills: "",
    status: "PUBLISHED"
  };

  const [isCreatingRoleModalOpen, setIsCreatingRoleModalOpen] = useState(false);
  const [roleData, setRoleData] = useState(initialRoleData);

  // Fetch Candidates
  const { data: candidatesRes, isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => (await api.get("/recruitment/candidates")).data,
  });

  // Fetch Job Roles
  const { data: rolesRes } = useQuery({
    queryKey: ["jobRoles"],
    queryFn: async () => (await api.get("/recruitment/job-roles")).data,
  });

  // Fetch Departments
  const { data: deptsRes } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get("/departments")).data,
  });

  const candidates = candidatesRes?.data || [];
  const roles = rolesRes?.data || [];
  const departments = deptsRes?.data || [];

  // Update Job Role Mutation
  const updateJobRoleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return (await api.put(`/recruitment/job-roles/${id}`, { status })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobRoles"] });
    }
  });

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c: any) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        c.firstName?.toLowerCase().includes(query) ||
        c.lastName?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.jobRole?.title?.toLowerCase().includes(query);
      const matchesRole = roleFilter === "ALL" || c.jobRoleId === roleFilter;
      const matchesStatus = statusFilter === "ALL" || c.interviewStatus === statusFilter || c.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [candidates, searchTerm, roleFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCandidates.slice(start, start + itemsPerPage);
  }, [filteredCandidates, currentPage]);

  // Metrics
  const totalCount = candidates.length;
  const screeningCount = candidates.filter((c: any) => c.interviewStatus === 'PENDING' || c.status === 'SCREENING').length;
  const interviewCount = candidates.filter((c: any) => c.interviewStatus === 'SCHEDULED' || c.interviewStatus === 'PASSED' || c.status === 'INTERVIEW').length;
  const offeredCount = candidates.filter((c: any) => c.status === 'OFFERED' || c.status === 'SELECTED').length;
  const hiredCount = candidates.filter((c: any) => c.status === 'HIRED' || c.status === 'SELECTED').length;
  const activeRolesCount = roles.length;

  // Chart Data
  const pipelineChartData = [
    { stage: "Applied", Candidates: totalCount },
    { stage: "Screening", Candidates: screeningCount },
    { stage: "Interview", Candidates: interviewCount },
    { stage: "Offered", Candidates: offeredCount },
    { stage: "Hired", Candidates: hiredCount },
  ];

  const statusPieData = [
    { name: "Pending", value: screeningCount || 1 },
    { name: "In Progress", value: interviewCount || 1 },
    { name: "Selected/Hired", value: hiredCount || 1 },
    { name: "Offered", value: offeredCount || 1 },
  ];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalJobRoleId = formData.jobRoleId;

      if (formData.jobRoleId === "new_role") {
        if (!roleData.title) {
          alert("Please enter a new job role title.");
          setIsSubmitting(false);
          return;
        }
        const newRole = await api.post("/recruitment/job-roles", roleData);
        finalJobRoleId = newRole.data.data.id;
      }

      const submitData = new FormData();
      submitData.append("firstName", formData.firstName);
      submitData.append("lastName", formData.lastName);
      submitData.append("email", formData.email);
      submitData.append("jobRoleId", finalJobRoleId);

      if (resumeFile) {
        submitData.append("resumeFile", resumeFile);
      }

      await api.post("/recruitment/candidates", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["jobRoles"] });

      setIsCreating(false);
      setFormData({ firstName: "", lastName: "", email: "", jobRoleId: "" });
      setResumeFile(null);
      setRoleData(initialRoleData);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to create candidate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoleOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleData.title) return;
    setIsSubmitting(true);
    try {
      await api.post("/recruitment/job-roles", roleData);
      queryClient.invalidateQueries({ queryKey: ["jobRoles"] });
      setIsCreatingRoleModalOpen(false);
      setRoleData(initialRoleData);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to create job role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/recruitment/candidates/${editCandidate.id}`, {
        interviewStatus: editCandidate.interviewStatus,
        status: editCandidate.status,
        screeningNotes: editCandidate.screeningNotes,
        reason: editCandidate.reason,
      });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setEditCandidate(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to update candidate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this candidate?")) {
      try {
        await api.delete(`/recruitment/candidates/${id}`);
        queryClient.invalidateQueries({ queryKey: ["candidates"] });
      } catch (error: any) {
        alert(error?.response?.data?.message || "Failed to delete");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELECTED":
      case "HIRED":
      case "PASSED":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">SELECTED</Badge>;
      case "SCHEDULED":
      case "INTERVIEW":
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800">IN PROGRESS</Badge>;
      case "OFFERED":
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800">OFFERED</Badge>;
      case "REJECTED":
      case "FAILED":
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800">REJECTED</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto w-full min-w-0">
      {/* Page Header */}
      <PageHeader
        title="Recruitment & Talent Acquisition"
        description="Applicant tracking, manage job openings, schedule interviews, and evaluate candidate pipelines."
        showSearch={false}
        showCreate={false}
        actionButton={
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
            <Link href="/careers" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
              <Button size="sm" variant="outline" className="w-full h-8 sm:h-9 text-xs px-2.5 sm:px-3 border-blue-500/40 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1 font-semibold">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Public Careers</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => setIsCreatingRoleModalOpen(true)} className="h-8 sm:h-9 text-xs px-2.5 sm:px-3">
              <Briefcase className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
              <span>Add Job Role</span>
            </Button>
            <Button size="sm" onClick={() => setIsCreating(true)} className="h-8 sm:h-9 text-xs px-2.5 sm:px-3 bg-primary hover:bg-primary/90 flex-1 sm:flex-initial">
              <Plus className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span>Create Candidate</span>
            </Button>
          </div>
        }
      />

      {/* 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-3">
        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Candidates</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-foreground truncate">{totalCount}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Applicants Registered</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Under Review</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-amber-600 truncate">{screeningCount}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Initial Screening</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Interviews</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-indigo-600 truncate">{interviewCount}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Scheduled & Active</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Offers Extended</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-purple-600 truncate">{offeredCount}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Awaiting Joining</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Active Job Roles</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-foreground truncate">{activeRolesCount}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Open Positions</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Successfully Hired</p>
              <h3 className="text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 text-emerald-600 truncate">{hiredCount}</h3>
              <p className="text-[9.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Onboarded Talent</p>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 sm:space-y-5">
        <TabsList className="bg-muted/60 p-1 rounded-xl flex overflow-x-auto no-scrollbar scroll-smooth gap-1 w-full sm:w-fit justify-start">
          <TabsTrigger value="candidates" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
            <Users className="w-3.5 h-3.5" />
            <span>Candidate Directory ({filteredCandidates.length})</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Openings & Roles ({roles.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
            <Layers className="w-3.5 h-3.5" />
            <span>Recruitment Funnel</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Candidate Directory */}
        <TabsContent value="candidates" className="space-y-4">
          <Card className="border shadow-xs">
            <CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full">
                <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search candidate name, email, or role..."
                    className="pl-8 h-8 sm:h-9 text-xs"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <select
                    className="h-8 sm:h-9 px-2.5 text-xs rounded-md border bg-background"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">All Job Roles</option>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>

                  <select
                    className="h-8 sm:h-9 px-2.5 text-xs rounded-md border bg-background"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="OFFERED">OFFERED</option>
                    <option value="SELECTED">SELECTED / HIRED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              {(searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("ALL");
                    setStatusFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className="h-8 sm:h-9 text-xs text-muted-foreground self-end sm:self-auto"
                >
                  Reset Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Table / Mobile Cards */}
          <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden divide-y divide-border">
              {isLoading ? (
                <div className="h-24 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Loading candidates...
                </div>
              ) : paginatedCandidates.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
                  No candidate profiles found matching your search.
                </div>
              ) : (
                paginatedCandidates.map((c: any) => {
                  const isCareerPortal = c.source === 'CAREER_PORTAL' || c.applications?.some((a: any) => a.source === 'CAREER_PORTAL');
                  const resumeUrl = c.resumeLink || c.resumeUrl;
                  return (
                    <div key={c.id} className="p-3 space-y-2.5 hover:bg-muted/15 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {c.firstName?.[0]}{c.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-foreground truncate">
                              {c.firstName} {c.lastName}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {c.email}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 scale-90 origin-right">
                          {getStatusBadge(c.status || c.interviewStatus)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-lg text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Applied Role</span>
                          <span className="font-semibold text-foreground text-[11px] truncate block">
                            {c.jobRole?.title || "General Application"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Source / Channel</span>
                          {isCareerPortal ? (
                            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/60 font-bold text-[9px] gap-1 px-1.5 py-0">
                              <Globe className="w-2.5 h-2.5" /> CAREER PORTAL
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[9px] px-1.5 py-0">
                              MANUAL HR
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                        <span className="inline-block font-semibold text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          {c.interviewStatus || "PENDING"}
                        </span>
                        <div className="flex items-center gap-1">
                          {resumeUrl ? (
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Resume</span>
                            </a>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-primary"
                            onClick={() => setViewCandidate(c)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewCandidate(c)}>
                                <Eye className="w-4 h-4 mr-2" /> View Candidate Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditCandidate(c)}>
                                <Edit className="w-4 h-4 mr-2" /> Update Selection Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-rose-600 focus:text-rose-600"
                                onClick={() => handleDelete(c.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Candidate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="font-semibold">Candidate Name</TableHead>
                    <TableHead className="font-semibold">Source</TableHead>
                    <TableHead className="font-semibold">Email & Contact</TableHead>
                    <TableHead className="font-semibold">Applied Job Role</TableHead>
                    <TableHead className="font-semibold">Interview Status</TableHead>
                    <TableHead className="font-semibold">Selection Status</TableHead>
                    <TableHead className="font-semibold">Resume Dossier</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          Loading candidates...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No candidate profiles found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCandidates.map((c: any) => {
                      const isCareerPortal = c.source === 'CAREER_PORTAL' || c.applications?.some((a: any) => a.source === 'CAREER_PORTAL');
                      const resumeUrl = c.resumeLink || c.resumeUrl;
                      return (
                        <TableRow key={c.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {c.firstName?.[0]}{c.lastName?.[0]}
                              </div>
                              <div>
                                <div className="font-bold text-foreground">
                                  {c.firstName} {c.lastName}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {c.applications?.[0]?.applicationNumber || `Ref: #${c.id.slice(0, 8).toUpperCase()}`}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {isCareerPortal ? (
                              <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/60 font-bold text-[10px] gap-1">
                                <Globe className="w-2.5 h-2.5" />
                                CAREER PORTAL
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px] font-semibold">
                                MANUAL HR
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="font-medium text-foreground">{c.email}</div>
                            <div className="text-[11px] text-muted-foreground">{c.phone || "No phone"}</div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="font-medium text-xs bg-muted/40">
                              {c.jobRole?.title || "General Application"}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span className="inline-block font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              {c.interviewStatus || "PENDING"}
                            </span>
                          </TableCell>

                          <TableCell>{getStatusBadge(c.status || c.interviewStatus)}</TableCell>

                          <TableCell>
                            {resumeUrl ? (
                              <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View Resume
                              </a>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">No Resume</span>
                            )}
                          </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => setViewCandidate(c)}
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              View
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewCandidate(c)}>
                                  <Eye className="w-4 h-4 mr-2" /> View Candidate Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditCandidate(c)}>
                                  <Edit className="w-4 h-4 mr-2" /> Update Selection Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-rose-600 focus:text-rose-600"
                                  onClick={() => handleDelete(c.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete Candidate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {filteredCandidates.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-0 text-xs text-muted-foreground pt-2">
              <span className="text-center sm:text-left">
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                <strong>{Math.min(currentPage * itemsPerPage, filteredCandidates.length)}</strong> of{" "}
                <strong>{filteredCandidates.length}</strong> candidates
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="font-medium text-foreground text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 text-xs"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Job Openings & Roles */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r: any) => {
              const roleCandidates = candidates.filter((c: any) => c.jobRoleId === r.id);
              const status = r.status || "PUBLISHED";
              return (
                <Card key={r.id} className="border shadow-xs hover:border-primary/50 transition-colors flex flex-col justify-between">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-foreground line-clamp-1">{r.title}</CardTitle>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.department?.name || "General Department"} • {r.workLocation || "Headquarters"} ({r.workMode || "ONSITE"})
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {r.description && (
                      <p className="text-muted-foreground line-clamp-2">{r.description}</p>
                    )}

                    <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Applied Applicants</span>
                      <span className="font-extrabold text-foreground text-sm">{roleCandidates.length} Candidates</span>
                    </div>

                    {/* Status & Public Portal Controls */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <select
                        value={status}
                        onChange={(e) => updateJobRoleMutation.mutate({ id: r.id, status: e.target.value })}
                        className="h-8 px-2 rounded-md border bg-background text-[11px] font-bold text-foreground focus:outline-none"
                      >
                        <option value="PUBLISHED">🟢 PUBLISHED (OPEN)</option>
                        <option value="PAUSED">⏸️ PAUSED</option>
                        <option value="CLOSED">🔴 CLOSED</option>
                        <option value="DRAFT">📝 DRAFT</option>
                      </select>

                      {r.slug && (
                        <Link 
                          href={`/careers/jobs/${r.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Public Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {r.openings ? `${r.openings} Openings` : '1 Opening'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => { setRoleFilter(r.id); setActiveTab("candidates"); }} className="h-7 text-xs text-primary font-semibold">
                        View Applicants →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 3: Recruitment Funnel */}
        <TabsContent value="pipeline" className="space-y-5">
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Applicant Pipeline & Stage Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {pipelineChartData.map((stage, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-card text-center space-y-1 shadow-2xs">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{stage.stage}</span>
                    <h3 className="text-2xl font-black text-primary">{stage.Candidates}</h3>
                    <p className="text-[11px] text-muted-foreground">Candidates</p>
                  </div>
                ))}
              </div>

              <div className="h-[320px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="stage" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="Candidates" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Analytics */}
        <TabsContent value="analytics" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-xs">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Candidate Selection Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] pt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border shadow-xs">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  Recruitment Efficiency Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs pt-4">
                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Average Time to Hire</span>
                    <p className="text-muted-foreground text-[11px]">From application to offer release</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">14 Days Avg</Badge>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Screening Pass Ratio</span>
                    <p className="text-muted-foreground text-[11px]">Percentage of candidates advancing to interview</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">68% Success</Badge>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Offer Acceptance Rate</span>
                    <p className="text-muted-foreground text-[11px]">Percentage of extended offers accepted</p>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">92% Conversion</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Candidate Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-3.5 sm:p-5 px-4 sm:px-6 border-b shrink-0 bg-background">
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-primary">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Register New Job Candidate</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">First Name *</Label>
                  <Input
                    required
                    placeholder="e.g. John"
                    className="h-8 sm:h-9 text-xs"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Last Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Doe"
                    className="h-8 sm:h-9 text-xs"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. john.doe@example.com"
                  className="h-8 sm:h-9 text-xs"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Job Role Position *</Label>
                <select
                  required
                  className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                  value={formData.jobRoleId}
                  onChange={(e) => setFormData({ ...formData, jobRoleId: e.target.value })}
                >
                  <option value="">Select Target Job Role</option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                  <option value="new_role">+ Create New Custom Job Role</option>
                </select>
              </div>

              {formData.jobRoleId === "new_role" && (
                <div className="p-2.5 sm:p-3 border rounded-lg bg-blue-50/50 space-y-1.5 sm:space-y-2">
                  <Label className="text-xs font-bold text-blue-800">New Job Role Title *</Label>
                  <Input
                    placeholder="e.g. Senior Frontend Engineer"
                    className="h-8 sm:h-9 text-xs bg-white"
                    value={roleData.title}
                    onChange={(e) => setRoleData({ ...roleData, title: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Upload Candidate Resume (PDF/DOCX)</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="h-8 sm:h-9 text-xs"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <DialogFooter className="p-3 sm:p-4 px-4 sm:px-6 border-t bg-muted/20 shrink-0 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreating(false)} disabled={isSubmitting} className="h-8 sm:h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 h-8 sm:h-9 text-xs">
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Register Candidate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Job Role Modal */}
      <Dialog open={isCreatingRoleModalOpen} onOpenChange={setIsCreatingRoleModalOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-3.5 sm:p-5 px-4 sm:px-6 border-b shrink-0 bg-background">
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-primary">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Create & Publish Job Opening</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRoleOnly} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3.5 sm:p-6 space-y-3 text-xs overflow-y-auto flex-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Role Title *</Label>
                <Input
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  className="h-8 sm:h-9 text-xs"
                  value={roleData.title}
                  onChange={(e) => setRoleData({ ...roleData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Department</Label>
                  <select
                    className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                    value={roleData.departmentId}
                    onChange={(e) => setRoleData({ ...roleData, departmentId: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Workplace Mode</Label>
                  <select
                    className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                    value={roleData.workMode}
                    onChange={(e) => setRoleData({ ...roleData, workMode: e.target.value })}
                  >
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Work Location</Label>
                  <Input
                    placeholder="e.g. Noida / Hybrid"
                    className="h-8 sm:h-9 text-xs"
                    value={roleData.workLocation}
                    onChange={(e) => setRoleData({ ...roleData, workLocation: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Available Openings</Label>
                  <Input
                    type="number"
                    min="1"
                    className="h-8 sm:h-9 text-xs"
                    value={roleData.openings}
                    onChange={(e) => setRoleData({ ...roleData, openings: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Min CTC (INR)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1200000"
                    className="h-8 sm:h-9 text-xs"
                    value={roleData.minSalary}
                    onChange={(e) => setRoleData({ ...roleData, minSalary: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Max CTC (INR)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2000000"
                    className="h-8 sm:h-9 text-xs"
                    value={roleData.maxSalary}
                    onChange={(e) => setRoleData({ ...roleData, maxSalary: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Key Skills (Comma separated)</Label>
                <Input
                  placeholder="e.g. React, Next.js, TypeScript, PostgreSQL"
                  className="h-8 sm:h-9 text-xs"
                  value={roleData.skills}
                  onChange={(e) => setRoleData({ ...roleData, skills: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Description & Requirements</Label>
                <Textarea
                  rows={3}
                  placeholder="Key responsibilities and qualifications..."
                  className="text-xs resize-none"
                  value={roleData.description}
                  onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Publication Status</Label>
                <select
                  className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                  value={roleData.status}
                  onChange={(e) => setRoleData({ ...roleData, status: e.target.value })}
                >
                  <option value="PUBLISHED">🟢 PUBLISHED (Accepts Applications Online)</option>
                  <option value="DRAFT">📝 DRAFT (Internal only)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="p-3 sm:p-4 px-4 sm:px-6 border-t bg-muted/20 shrink-0 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingRoleModalOpen(false)} className="h-8 sm:h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 font-bold h-8 sm:h-9 text-xs">
                {isSubmitting ? "Creating..." : "Save & Create Opening"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Selection Status Modal */}
      {editCandidate && (
        <Dialog open={!!editCandidate} onOpenChange={() => setEditCandidate(null)}>
          <DialogContent className="w-[95vw] max-w-md max-h-[92vh] sm:max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-3.5 sm:p-5 px-4 sm:px-6 border-b shrink-0 bg-background">
              <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                <span>Update Candidate Evaluation Status</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-3.5 sm:p-6 space-y-3 text-xs overflow-y-auto flex-1">
                <div className="p-2.5 sm:p-3 border rounded-lg bg-muted/20 space-y-1">
                  <div className="font-bold text-foreground">{editCandidate.firstName} {editCandidate.lastName}</div>
                  <div className="text-muted-foreground">{editCandidate.email} • {editCandidate.jobRole?.title || "Role"}</div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Interview Status</Label>
                  <select
                    className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                    value={editCandidate.interviewStatus || "PENDING"}
                    onChange={(e) => setEditCandidate({ ...editCandidate, interviewStatus: e.target.value })}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="PASSED">PASSED / COMPLETED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Pipeline Selection Stage</Label>
                  <select
                    className="flex h-8 sm:h-9 w-full rounded-md border bg-background px-2.5 sm:px-3 text-xs"
                    value={editCandidate.status || "IN_PROGRESS"}
                    onChange={(e) => setEditCandidate({ ...editCandidate, status: e.target.value })}
                  >
                    <option value="APPLIED">APPLIED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="SHORTLISTED">SHORTLISTED</option>
                    <option value="INTERVIEW_SCHEDULED">INTERVIEW SCHEDULED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="OFFERED">OFFER EXTENDED</option>
                    <option value="SELECTED">SELECTED / HIRED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Screening / Evaluation Notes</Label>
                  <Textarea
                    rows={2}
                    placeholder="Notes from interview or reason for status update..."
                    className="text-xs resize-none"
                    value={editCandidate.screeningNotes || ""}
                    onChange={(e) => setEditCandidate({ ...editCandidate, screeningNotes: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="p-3 sm:p-4 px-4 sm:px-6 border-t bg-muted/20 shrink-0 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditCandidate(null)} className="h-8 sm:h-9 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 font-bold h-8 sm:h-9 text-xs">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Candidate Profile Viewer Modal */}
      {viewCandidate && (
        <Dialog open={!!viewCandidate} onOpenChange={() => setViewCandidate(null)}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-3.5 sm:p-5 px-4 sm:px-6 border-b shrink-0 bg-background">
              <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-primary">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Candidate Dossier & Profile</span>
              </DialogTitle>
            </DialogHeader>

            <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 text-xs overflow-y-auto flex-1">
              <div className="flex items-center gap-3 p-3 sm:p-4 border rounded-xl bg-muted/20">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary font-bold text-base sm:text-lg flex items-center justify-center shrink-0">
                  {viewCandidate.firstName?.[0]}{viewCandidate.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-foreground truncate">{viewCandidate.firstName} {viewCandidate.lastName}</h3>
                    {viewCandidate.source === 'CAREER_PORTAL' ? (
                      <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 font-bold text-[9px] sm:text-[10px] shrink-0">
                        CAREER PORTAL
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[9px] sm:text-[10px] shrink-0">MANUAL HR</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-[11px] sm:text-xs">{viewCandidate.email} • {viewCandidate.phone || "No phone"}</p>
                  <Badge variant="outline" className="mt-1 font-semibold text-[10px] sm:text-xs">{viewCandidate.jobRole?.title || "Candidate"}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 border rounded-xl bg-card">
                <div>
                  <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Experience</span>
                  <p className="font-bold text-foreground mt-0.5">{viewCandidate.experienceYears ? `${viewCandidate.experienceYears} Years` : "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Current Company</span>
                  <p className="font-bold text-foreground mt-0.5 truncate">{viewCandidate.currentCompany || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Expected CTC</span>
                  <p className="font-bold text-foreground mt-0.5">{viewCandidate.expectedCtc || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Notice Period</span>
                  <p className="font-bold text-foreground mt-0.5">{viewCandidate.noticePeriod?.replace('_', ' ') || "N/A"}</p>
                </div>
              </div>

              {viewCandidate.skills && (
                <div className="p-3 border rounded-xl bg-card space-y-1">
                  <span className="text-muted-foreground font-semibold block text-[10px] sm:text-[11px]">Skills & Competencies:</span>
                  <p className="font-medium text-foreground">{viewCandidate.skills}</p>
                </div>
              )}

              {/* Application Status History Audit Trail */}
              {viewCandidate.applications?.[0]?.statusHistory && viewCandidate.applications[0].statusHistory.length > 0 && (
                <div className="p-3 sm:p-4 border rounded-xl bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-primary" />
                    Application Audit Trail & History
                  </span>
                  <div className="space-y-2 pt-1">
                    {viewCandidate.applications[0].statusHistory.map((hist: any, hIdx: number) => (
                      <div key={hIdx} className="text-[11px] p-2 rounded-lg bg-card border flex items-center justify-between">
                        <div>
                          <span className="font-bold text-foreground">Stage: {hist.newStatus}</span>
                          {hist.reason && <p className="text-muted-foreground mt-0.5">{hist.reason}</p>}
                        </div>
                        <div className="text-right text-muted-foreground">
                          <span className="font-semibold block">{hist.actorName || "System"}</span>
                          <span className="text-[10px]">{new Date(hist.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume Download */}
              {(viewCandidate.resumeLink || viewCandidate.resumeUrl) && (
                <div className="p-3 sm:p-4 border rounded-xl bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-blue-900 dark:text-blue-300 block truncate">Candidate Resume</span>
                      <span className="text-[10px] sm:text-[11px] text-blue-700 dark:text-blue-400">PDF / DOCX document</span>
                    </div>
                  </div>
                  <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-8 text-xs shrink-0">
                    <a href={viewCandidate.resumeLink || viewCandidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                      Download / View
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="p-3 sm:p-4 px-4 sm:px-6 border-t bg-muted/20 shrink-0 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewCandidate(null)} className="h-8 sm:h-9 text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
