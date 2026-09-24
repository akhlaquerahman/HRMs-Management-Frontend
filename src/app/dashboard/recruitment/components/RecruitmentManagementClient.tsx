"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import api from "@/lib/axios";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { nameValidation, emailValidation, employeeNameValidation } from "@/lib/validations/common.schema";

import { RecruitmentKPICards } from './RecruitmentKPICards';
import { RecruitmentFilterToolbar } from './RecruitmentFilterToolbar';
import { RecruitmentTable } from './RecruitmentTable';

const candidateSchema = z.object({
  firstName: employeeNameValidation,
  lastName: employeeNameValidation,
  email: emailValidation,
  jobRoleId: z.string().min(1, "Job Role is required"),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

export function RecruitmentManagementClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [viewCandidate, setViewCandidate] = useState<any>(null);
  const [editCandidate, setEditCandidate] = useState<any>(null);

  const [filters, setFilters] = useState({ search: "", jobRoleId: "ALL", status: "ALL" });

  const { register, handleSubmit, formState: { errors, isValid }, reset, setValue, watch } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    mode: "onBlur",
    defaultValues: { firstName: "", lastName: "", email: "", jobRoleId: "" }
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleData, setRoleData] = useState({ title: "", description: "" });

  const { data: candidatesRes, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => (await api.get("/recruitment/candidates")).data,
  });

  const { data: rolesRes } = useQuery({
    queryKey: ["jobRoles"],
    queryFn: async () => (await api.get("/recruitment/job-roles")).data,
  });

  const candidates = candidatesRes?.data || [];
  const roles = rolesRes?.data || [];

  const filteredCandidates = candidates.filter((c: any) => {
    const matchesSearch = c.firstName?.toLowerCase().includes(filters.search.toLowerCase()) || 
                          c.lastName?.toLowerCase().includes(filters.search.toLowerCase()) ||
                          c.email?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesRole = filters.jobRoleId === "ALL" || c.jobRoleId === filters.jobRoleId;
    const matchesStatus = filters.status === "ALL" || c.interviewStatus === filters.status;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate KPIs
  const totalCandidates = candidates.length;
  const pendingInterviews = candidates.filter((c: any) => c.interviewStatus === 'PENDING').length;
  const selectedCandidates = candidates.filter((c: any) => c.status === 'SELECTED').length;
  const activeRoles = roles.length;

  const kpiMetrics = [
    { title: "Total Candidates", value: totalCandidates, subtitle: "All Time", icon: "Users" },
    { title: "Pending Interviews", value: pendingInterviews, subtitle: "Requires Action", icon: "Clock" },
    { title: "Selected Candidates", value: selectedCandidates, subtitle: "Hired", icon: "CheckCircle" },
    { title: "Active Roles", value: activeRoles, subtitle: "Open Positions", icon: "Briefcase" },
  ];

  const handleFilterChange = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", jobRoleId: "ALL", status: "ALL" });
  };

  const handleCreateSubmit = async (data: CandidateFormData) => {
    setIsSubmitting(true);
    try {
      let finalJobRoleId = data.jobRoleId;
      
      if (data.jobRoleId === "new_role") {
        if (!roleData.title) {
          alert("Please enter a new job role title.");
          setIsSubmitting(false);
          return;
        }
        const newRole = await api.post("/recruitment/job-roles", roleData);
        finalJobRoleId = newRole.data.data.id;
      }

      const submitData = new FormData();
      submitData.append("firstName", data.firstName);
      submitData.append("lastName", data.lastName);
      submitData.append("email", data.email);
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
      reset();
      setResumeFile(null);
      setRoleData({ title: "", description: "" });
      setIsCreatingRole(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to create candidate");
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Recruitment & Candidates" 
        description="Manage candidate tracking, interviews, and job roles."
        showSearch={false}
        showCreate={false}
        showExport={false}
        showImport={false}
        showFilters={false}
      />

      <RecruitmentKPICards metrics={kpiMetrics} loading={isLoadingCandidates} />

      <div className="grid grid-cols-1 gap-6">
        <RecruitmentFilterToolbar 
          onSearch={(v) => handleFilterChange('search', v)}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          roles={roles}
          onCreateClick={() => setIsCreating(true)}
        />
        <RecruitmentTable 
          data={filteredCandidates}
          loading={isLoadingCandidates}
          onView={(c) => setViewCandidate(c)}
          onEdit={(c) => setEditCandidate(c)}
          onDelete={(id) => handleDelete(id)}
        />
      </div>

      <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Candidate Details")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateSubmit)} className="flex flex-col gap-4 mt-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-1 block">{t("First Name")}</label>
              <Input 
                {...(() => {
                  const { onChange, ...rest } = register("firstName");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/[^a-zA-Z\s\'-]/g, '');
                      onChange(e);
                    }
                  }
                })()} 
              />
              {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Last Name")}</label>
              <Input 
                {...(() => {
                  const { onChange, ...rest } = register("lastName");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/[^a-zA-Z\s\'-]/g, '');
                      onChange(e);
                    }
                  }
                })()} 
              />
              {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">{t("Email Address")}</label>
              <Input type="email" {...register("email")} />
              {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">{t("Job Role")}</label>
              <select 
                {...(() => {
                  const { onChange, ...rest } = register("jobRoleId");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                      const val = e.target.value;
                      setIsCreatingRole(val === "new_role");
                      onChange(e);
                    }
                  }
                })()}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="" disabled>{t("Select Job Role")}</option>
                {roles.map((role: any) => (
                  <option key={role.id} value={role.id}>{role.title}</option>
                ))}
                <option value="new_role" className="font-bold text-primary">+ {t("Others / New Role")}</option>
              </select>
              {errors.jobRoleId && <span className="text-xs text-red-500">{errors.jobRoleId.message}</span>}
            </div>

            {isCreatingRole && (
              <div className="md:col-span-2 p-4 border rounded-md bg-muted/30 flex flex-col gap-4">
                <h4 className="font-medium text-sm text-primary flex items-center"><Briefcase className="w-4 h-4 mr-2"/> Define New Job Role</h4>
                <div>
                  <label className="text-xs font-medium mb-1 block">{t("Role Title")}</label>
                  <Input required placeholder="e.g. Senior Frontend Engineer" value={roleData.title} onChange={e => setRoleData({...roleData, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">{t("Role Description (Optional)")}</label>
                  <Textarea placeholder="Brief requirements..." value={roleData.description} onChange={e => setRoleData({...roleData, description: e.target.value})} />
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">{t("Resume (Optional)")}</label>
              <Input 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={e => setResumeFile(e.target.files?.[0] || null)} 
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>{t("Cancel")}</Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>{isSubmitting ? t("Submitting...") : t("Save Candidate")}</Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewCandidate} onOpenChange={(open) => !open && setViewCandidate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("Candidate Profile")}</DialogTitle>
          </DialogHeader>
          {viewCandidate && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 border-b pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {viewCandidate.firstName.charAt(0)}{viewCandidate.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{viewCandidate.firstName} {viewCandidate.lastName}</h2>
                  <p className="text-muted-foreground">{viewCandidate.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block">{t("Applied For Role")}</label>
                  <p className="font-medium flex items-center"><Briefcase className="w-4 h-4 mr-2" /> {viewCandidate.jobRole?.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block">{t("Interview Status")}</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${viewCandidate.interviewStatus === 'DONE' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {viewCandidate.interviewStatus}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block">{t("Selection Status")}</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        viewCandidate.status === 'SELECTED' ? 'bg-emerald-100 text-emerald-700' : 
                        viewCandidate.status === 'NOT_SELECTED' ? 'bg-rose-100 text-rose-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                    {viewCandidate.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block">{t("Resume")}</label>
                  {viewCandidate.resumeLink ? (
                    <a href={viewCandidate.resumeLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center text-sm font-medium">
                      <FileText className="w-4 h-4 mr-1" /> Open Resume
                    </a>
                  ) : <span className="text-sm text-muted-foreground">Not provided</span>}
                </div>
              </div>
              {viewCandidate.jobRole?.description && (
                <div className="mt-4 pt-4 border-t">
                  <label className="text-xs text-muted-foreground block mb-2">{t("Role Description")}</label>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{viewCandidate.jobRole.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCandidate(null)}>{t("Close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editCandidate} onOpenChange={(open) => !open && setEditCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Update Candidate Status")}</DialogTitle>
          </DialogHeader>
          {editCandidate && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t("Interview Status")}</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={editCandidate.interviewStatus} 
                  onChange={e => setEditCandidate({...editCandidate, interviewStatus: e.target.value})}
                >
                  <option value="PENDING">Pending</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t("Selection Status")}</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={editCandidate.status} 
                  onChange={e => setEditCandidate({...editCandidate, status: e.target.value})}
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SELECTED">Selected</option>
                  <option value="NOT_SELECTED">Not Selected</option>
                </select>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditCandidate(null)}>{t("Cancel")}</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t("Saving...") : t("Save Changes")}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
