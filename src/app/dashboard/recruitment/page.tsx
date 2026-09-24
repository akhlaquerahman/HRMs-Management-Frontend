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
  Calendar
} from "lucide-react";
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

  const [isCreatingRoleModalOpen, setIsCreatingRoleModalOpen] = useState(false);
  const [roleData, setRoleData] = useState({ title: "", description: "", departmentId: "" });

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

  const candidates = candidatesRes?.data || [];
  const roles = rolesRes?.data || [];

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
      setRoleData({ title: "", description: "", departmentId: "" });
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
      setRoleData({ title: "", description: "", departmentId: "" });
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
    <div className="space-y-6 max-w-[1600px] mx-auto p-6">
      {/* Page Header */}
      <PageHeader
        title="Recruitment & Talent Acquisition"
        description="Applicant tracking, manage job openings, schedule interviews, and evaluate candidate pipelines."
        showSearch={false}
        showCreate={false}
        actionButton={
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setIsCreatingRoleModalOpen(true)} className="h-9">
              <Briefcase className="w-4 h-4 mr-2 text-primary" />
              Add Job Role
            </Button>
            <Button size="sm" onClick={() => setIsCreating(true)} className="h-9 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Candidate
            </Button>
          </div>
        }
      />

      {/* 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Candidates</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">{totalCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Applicants Registered</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Under Review</p>
              <h3 className="text-xl font-bold mt-1 text-amber-600">{screeningCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Initial Screening</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interviews</p>
              <h3 className="text-xl font-bold mt-1 text-indigo-600">{interviewCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled & Active</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Offers Extended</p>
              <h3 className="text-xl font-bold mt-1 text-purple-600">{offeredCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting Joining</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Job Roles</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">{activeRolesCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Open Positions</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Successfully Hired</p>
              <h3 className="text-xl font-bold mt-1 text-emerald-600">{hiredCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Onboarded Talent</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-5">
        <TabsList className="bg-muted/60 p-1 rounded-xl flex flex-wrap gap-1 w-fit">
          <TabsTrigger value="candidates" className="rounded-lg px-4 py-2 text-xs font-semibold gap-2">
            <Users className="w-4 h-4" />
            Candidate Directory ({filteredCandidates.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg px-4 py-2 text-xs font-semibold gap-2">
            <Briefcase className="w-4 h-4" />
            Job Openings & Roles ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-lg px-4 py-2 text-xs font-semibold gap-2">
            <Layers className="w-4 h-4" />
            Recruitment Funnel
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-4 py-2 text-xs font-semibold gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics & Reports
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Candidate Directory */}
        <TabsContent value="candidates" className="space-y-4">
          <Card className="border shadow-xs">
            <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search candidate name, email, or role..."
                    className="pl-8 h-9 text-xs"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <select
                  className="h-9 px-3 text-xs rounded-md border bg-background"
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
                  className="h-9 px-3 text-xs rounded-md border bg-background"
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
                  className="h-9 text-xs text-muted-foreground"
                >
                  Reset Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
            <Table className="text-xs">
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="font-semibold">Candidate Name</TableHead>
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
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Loading candidates...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No candidate profiles found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCandidates.map((c: any) => (
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
                            <div className="text-[11px] text-muted-foreground">Ref: #{c.id.slice(0, 8).toUpperCase()}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-foreground">{c.email}</div>
                        <div className="text-[11px] text-muted-foreground">Applied online</div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-medium text-xs bg-muted/40">
                          {c.jobRole?.title || "General Application"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="inline-block font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {c.interviewStatus || "PENDING"}
                        </span>
                      </TableCell>

                      <TableCell>{getStatusBadge(c.status || c.interviewStatus)}</TableCell>

                      <TableCell>
                        {c.resumeUrl ? (
                          <a
                            href={c.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredCandidates.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>
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
                  className="h-8 px-3"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="font-medium text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3"
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
              return (
                <Card key={r.id} className="border shadow-xs hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">{r.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Department Position</p>
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
                    <div className="flex items-center justify-between pt-1">
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                        ACTIVE OPENING
                      </Badge>
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
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Plus className="w-5 h-5" />
              Register New Job Candidate
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">First Name *</Label>
                <Input
                  required
                  placeholder="e.g. John"
                  className="h-9 text-xs"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Last Name *</Label>
                <Input
                  required
                  placeholder="e.g. Doe"
                  className="h-9 text-xs"
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
                className="h-9 text-xs"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Job Role Position *</Label>
              <select
                required
                className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
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
              <div className="p-3 border rounded-lg bg-blue-50/50 space-y-2">
                <Label className="text-xs font-bold text-blue-800">New Job Role Title *</Label>
                <Input
                  placeholder="e.g. Senior Frontend Engineer"
                  className="h-9 text-xs bg-white"
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
                className="h-9 text-xs"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Register Candidate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Job Role Modal */}
      <Dialog open={isCreatingRoleModalOpen} onOpenChange={setIsCreatingRoleModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Briefcase className="w-5 h-5" />
              Create New Job Opening Role
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRoleOnly} className="space-y-4 text-xs mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Role Title *</Label>
              <Input
                required
                placeholder="e.g. Lead DevOps Specialist"
                className="h-9 text-xs"
                value={roleData.title}
                onChange={(e) => setRoleData({ ...roleData, title: e.target.value })}
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

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreatingRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                Create Opening
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Selection Status Modal */}
      {editCandidate && (
        <Dialog open={!!editCandidate} onOpenChange={() => setEditCandidate(null)}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Update Candidate Evaluation Status
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs mt-2">
              <div className="p-3 border rounded-lg bg-muted/20 space-y-1">
                <div className="font-bold text-foreground">{editCandidate.firstName} {editCandidate.lastName}</div>
                <div className="text-muted-foreground">{editCandidate.email} • {editCandidate.jobRole?.title || "Role"}</div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Interview Status</Label>
                <select
                  className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
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
                <Label className="text-xs font-semibold">Selection Status</Label>
                <select
                  className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                  value={editCandidate.status || "IN_PROGRESS"}
                  onChange={(e) => setEditCandidate({ ...editCandidate, status: e.target.value })}
                >
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="OFFERED">OFFERED</option>
                  <option value="SELECTED">SELECTED / HIRED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditCandidate(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
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
          <DialogContent className="max-w-xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                Candidate Dossier & Profile
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-2">
              <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/20">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0">
                  {viewCandidate.firstName?.[0]}{viewCandidate.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{viewCandidate.firstName} {viewCandidate.lastName}</h3>
                  <p className="text-muted-foreground">{viewCandidate.email}</p>
                  <Badge variant="outline" className="mt-1 font-semibold">{viewCandidate.jobRole?.title || "Candidate"}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 border rounded-xl bg-card">
                <div>
                  <span className="text-muted-foreground">Interview Status:</span>
                  <p className="font-bold text-foreground mt-0.5">{viewCandidate.interviewStatus || "PENDING"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Selection Status:</span>
                  <p className="font-bold text-emerald-600 mt-0.5">{viewCandidate.status || "IN_PROGRESS"}</p>
                </div>
              </div>

              {viewCandidate.resumeUrl && (
                <div className="p-4 border rounded-xl bg-blue-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-bold text-blue-900 block">Candidate Resume Document</span>
                      <span className="text-[11px] text-blue-700">Uploaded for evaluation</span>
                    </div>
                  </div>
                  <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-500 text-white">
                    <a href={viewCandidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                      Download PDF
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setViewCandidate(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
