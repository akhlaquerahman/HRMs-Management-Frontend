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
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Users,
  ShieldCheck,
  FolderLock,
  Clock,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Download,
  MoreVertical,
  X,
  FileCheck
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6', '#06b6d4'];

export default function DocumentsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("vault");
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewDocument, setViewDocument] = useState<any>(null);
  const [editDocument, setEditDocument] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Employee combobox search state for upload modal
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    documentTypeId: "",
    documentNumber: ""
  });

  const [isCreatingTypeModalOpen, setIsCreatingTypeModalOpen] = useState(false);
  const [typeData, setTypeData] = useState({ name: "" });
  const [rejectRemarks, setRejectRemarks] = useState("");

  // Fetch Documents
  const { data: documentsRes, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => (await api.get("/documents")).data,
  });

  // Fetch Employees
  const { data: employeesRes } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get("/employees")).data,
  });

  // Fetch Document Types
  const { data: documentTypesRes } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: async () => (await api.get("/documents/types")).data,
  });

  const documents = documentsRes?.data || [];
  const employees = employeesRes?.data || [];
  const documentTypes = documentTypesRes?.data || [];

  // Filtered Employees for Combobox
  const filteredEmployeesForSelect = useMemo(() => {
    if (!empSearchQuery) return employees.slice(0, 15);
    const query = empSearchQuery.toLowerCase();
    return employees.filter((e: any) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(query) ||
      e.email?.toLowerCase().includes(query) ||
      e.employeeId?.toLowerCase().includes(query)
    ).slice(0, 15);
  }, [employees, empSearchQuery]);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc: any) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        doc.employee?.firstName?.toLowerCase().includes(query) ||
        doc.employee?.lastName?.toLowerCase().includes(query) ||
        doc.employee?.email?.toLowerCase().includes(query) ||
        doc.documentType?.toLowerCase().includes(query) ||
        doc.documentNumber?.toLowerCase().includes(query);

      const matchesType = typeFilter === "ALL" || doc.documentType === typeFilter || doc.documentTypeId === typeFilter;
      const matchesStatus = statusFilter === "ALL" || doc.verificationStatus === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchTerm, typeFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage) || 1;
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDocuments.slice(start, start + itemsPerPage);
  }, [filteredDocuments, currentPage]);

  // Metrics
  const totalCount = documents.length;
  const approvedCount = documents.filter((d: any) => d.verificationStatus === 'APPROVED').length;
  const pendingCount = documents.filter((d: any) => d.verificationStatus === 'PENDING').length;
  const rejectedCount = documents.filter((d: any) => d.verificationStatus === 'REJECTED').length;
  const categoriesCount = documentTypes.length || 4;
  const verificationRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 100;

  // Chart Data
  const statusChartData = [
    { name: "Verified / Approved", value: approvedCount || 1 },
    { name: "Pending Verification", value: pendingCount || 1 },
    { name: "Rejected / Defective", value: rejectedCount || 1 },
  ];

  const typeDistributionData = documentTypes.map((t: any) => ({
    name: t.name,
    Documents: documents.filter((d: any) => d.documentType === t.name || d.documentTypeId === t.id).length
  }));

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      alert("Please select an employee.");
      return;
    }
    if (!file) {
      alert("Please select a document file to upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalTypeName = formData.documentTypeId;

      if (formData.documentTypeId === "new_type") {
        if (!typeData.name) {
          alert("Please enter a new document type name.");
          setIsSubmitting(false);
          return;
        }
        const newType = await api.post("/documents/types", typeData);
        finalTypeName = newType.data.data.name;
      } else {
        const selectedType = documentTypes.find((t: any) => t.id === formData.documentTypeId);
        finalTypeName = selectedType?.name || formData.documentTypeId;
      }

      const uploadData = new FormData();
      uploadData.append("employeeId", formData.employeeId);
      uploadData.append("documentType", finalTypeName);
      if (formData.documentNumber) uploadData.append("documentNumber", formData.documentNumber);
      uploadData.append("file", file);

      await api.post("/documents/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documentTypes"] });

      setIsCreating(false);
      setFormData({ employeeId: "", documentTypeId: "", documentNumber: "" });
      setFile(null);
      setEmpSearchQuery("");
      setTypeData({ name: "" });
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTypeOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeData.name) return;
    setIsSubmitting(true);
    try {
      await api.post("/documents/types", typeData);
      queryClient.invalidateQueries({ queryKey: ["documentTypes"] });
      setIsCreatingTypeModalOpen(false);
      setTypeData({ name: "" });
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to create document type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveKYC = async (docId: string) => {
    try {
      await api.post(`/documents/${docId}/approve`);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setEditDocument(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to approve document");
    }
  };

  const handleRejectKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDocument) return;
    setIsSubmitting(true);
    try {
      await api.post(`/documents/${editDocument.id}/reject`, { remarks: rejectRemarks || "Rejected by HR Admin" });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setEditDocument(null);
      setRejectRemarks("");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to reject document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this document from the vault?")) {
      try {
        await api.delete(`/documents/${id}`);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      } catch (error: any) {
        alert(error?.response?.data?.message || "Failed to delete");
      }
    }
  };

  const getKYCBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">APPROVED</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800">REJECTED</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800">PENDING REVIEW</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6">
      {/* Page Header */}
      <PageHeader
        title="Document & KYC Verification"
        description="Employee identity verification, compliance documents, and KYC records."
        showSearch={false}
        showCreate={false}
        actionButton={
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreatingTypeModalOpen(true)}
              title="Add Document Type"
              className="h-9 px-2.5 sm:px-3 text-xs font-medium gap-1.5 shrink-0"
            >
              <FileCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="inline sm:hidden">+ Type</span>
              <span className="hidden sm:inline">Add Document Type</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="h-9 px-2.5 sm:px-3 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-initial whitespace-nowrap justify-center"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Upload Document</span>
            </Button>
          </div>
        }
      />

      {/* 6 KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <Card className="border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Vault Files</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-foreground">{totalCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Documents Uploaded</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <FolderLock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">KYC Approved</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-emerald-600">{approvedCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Verified Records</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Pending Review</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-amber-600">{pendingCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Awaiting HR Audit</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Defective / Rejected</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-rose-600">{rejectedCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Action Required</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Categories</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-foreground">{categoriesCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Form Types</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Compliance</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-emerald-600">{verificationRate}%</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">KYC Verified</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-5">
        <TabsList className="bg-muted/60 p-1 rounded-xl flex flex-wrap gap-1 w-fit">
          <TabsTrigger value="vault" className="rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold gap-2">
            <FolderLock className="w-4 h-4" />
            Document Vault ({filteredDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="kyc" className="rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold gap-2">
            <ShieldCheck className="w-4 h-4" />
            KYC Verification Matrix ({pendingCount} Pending)
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold gap-2">
            <Layers className="w-4 h-4" />
            Document Types ({documentTypes.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold gap-2">
            <BarChart3 className="w-4 h-4" />
            Vault Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Document Vault Table */}
        <TabsContent value="vault" className="space-y-4">
          <Card className="border shadow-xs">
            <CardContent className="p-3 sm:p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Employee Name, Email, or Document Number..."
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
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Document Types</option>
                  {documentTypes.map((t: any) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Passport">Passport</option>
                </select>

                <select
                  className="h-9 px-3 text-xs rounded-md border bg-background"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All KYC Statuses</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING REVIEW</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {(searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("ALL");
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
          <div className="border rounded-xl bg-card overflow-x-auto custom-scrollbar shadow-xs">
            <Table className="text-xs">
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="font-semibold">Employee Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Document Type</TableHead>
                  <TableHead className="font-semibold">Document No. / Reference</TableHead>
                  <TableHead className="font-semibold">KYC Status</TableHead>
                  <TableHead className="font-semibold">Document File</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Loading documents vault...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No documents found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDocuments.map((d: any) => (
                    <TableRow key={d.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {d.employee?.firstName?.[0]}{d.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">
                              {d.employee ? `${d.employee.firstName} ${d.employee.lastName}` : "Staff Member"}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{d.employee?.department?.name || "General"}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-foreground">{d.employee?.email || "—"}</div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-xs bg-blue-50/50 text-blue-700 border-blue-200">
                          {d.documentType || "Verification Document"}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {d.documentNumber || d.encryptedDocumentNumber || "—"}
                      </TableCell>

                      <TableCell>{getKYCBadge(d.verificationStatus)}</TableCell>

                      <TableCell>
                        {(d.fileUrl || (d.encryptedDocumentPath && d.encryptedDocumentPath !== 'HIDDEN')) ? (
                          <a
                            href={d.fileUrl || d.encryptedDocumentPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Document
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">No File Attached</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setViewDocument(d)}
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
                              <DropdownMenuItem onClick={() => setViewDocument(d)}>
                                <Eye className="w-4 h-4 mr-2" /> View File Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditDocument(d)}>
                                <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" /> Review KYC Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-rose-600 focus:text-rose-600"
                                onClick={() => handleDelete(d.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Document
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
          {filteredDocuments.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                <strong>{Math.min(currentPage * itemsPerPage, filteredDocuments.length)}</strong> of{" "}
                <strong>{filteredDocuments.length}</strong> vault documents
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

        {/* Tab 2: KYC Verification Matrix */}
        <TabsContent value="kyc" className="space-y-4">
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                KYC Verification & Audit Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.filter((d: any) => d.verificationStatus === 'PENDING').length === 0 ? (
                  <div className="md:col-span-3 p-8 text-center text-muted-foreground italic border rounded-xl bg-muted/10">
                    🎉 All pending KYC documents have been reviewed and audited!
                  </div>
                ) : (
                  documents.filter((d: any) => d.verificationStatus === 'PENDING').map((d: any) => (
                    <Card key={d.id} className="border border-amber-200 bg-amber-50/20 shadow-xs">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">
                            {d.employee ? `${d.employee.firstName} ${d.employee.lastName}` : "Employee"}
                          </CardTitle>
                          <p className="text-[11px] text-muted-foreground">{d.employee?.email}</p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">PENDING</Badge>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        <div className="p-2.5 border rounded-lg bg-background flex justify-between items-center">
                          <span className="font-semibold text-foreground">{d.documentType}</span>
                          <span className="font-mono text-muted-foreground text-[11px]">{d.documentNumber || "No Ref"}</span>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleApproveKYC(d.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditDocument(d)}
                            className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 h-8 text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Categories & Policies */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentTypes.map((t: any) => {
              const typeDocs = documents.filter((d: any) => d.documentType === t.name || d.documentTypeId === t.id);
              return (
                <Card key={t.id} className="border shadow-xs hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">{t.name}</CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Category Form</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Uploaded Files</span>
                      <span className="font-extrabold text-foreground text-sm">{typeDocs.length} Files</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setTypeFilter(t.name); setActiveTab("vault"); }} className="w-full h-7 text-xs text-primary font-semibold justify-center">
                      Browse Category Vault →
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 4: Vault Analytics */}
        <TabsContent value="analytics" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-xs">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  KYC Verification Status Ratio
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] pt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label
                    >
                      {statusChartData.map((entry, index) => (
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
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600">
                  <BarChart3 className="w-4 h-4" />
                  Document Distribution by Type
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="Documents" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Document Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Plus className="w-5 h-5" />
              Upload Employee Document to Vault
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs mt-2">
            {/* Searchable Employee Combobox */}
            <div className="space-y-1 relative">
              <Label className="text-xs font-semibold">Select Employee *</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type employee name or email to search..."
                  className="pl-8 pr-8 h-9 text-xs"
                  value={empSearchQuery}
                  onFocus={() => setIsEmpDropdownOpen(true)}
                  onChange={(e) => {
                    setEmpSearchQuery(e.target.value);
                    setIsEmpDropdownOpen(true);
                    if (formData.employeeId) setFormData({ ...formData, employeeId: "" });
                  }}
                />
                {empSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmpSearchQuery("");
                      setFormData({ ...formData, employeeId: "" });
                      setIsEmpDropdownOpen(true);
                    }}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isEmpDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover text-popover-foreground border rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y text-xs">
                  {filteredEmployeesForSelect.length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground">
                      No matching employees found
                    </div>
                  ) : (
                    filteredEmployeesForSelect.map((emp: any) => {
                      const isSelected = formData.employeeId === emp.id;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setFormData({ ...formData, employeeId: emp.id });
                            setEmpSearchQuery(`${emp.firstName} ${emp.lastName} (${emp.email})`);
                            setIsEmpDropdownOpen(false);
                          }}
                          className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors ${
                            isSelected ? "bg-primary/10 font-bold text-primary" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-semibold">{emp.firstName} {emp.lastName}</div>
                              <div className="text-[11px] text-muted-foreground">{emp.email}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                            {emp.employeeId || "EMP"}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Document Type *</Label>
              <select
                required
                className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                value={formData.documentTypeId}
                onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
              >
                <option value="">Select Document Category</option>
                {documentTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Offer Letter">Offer Letter</option>
                <option value="Passport">Passport</option>
                <option value="new_type">+ Create Custom Document Type</option>
              </select>
            </div>

            {formData.documentTypeId === "new_type" && (
              <div className="p-3 border rounded-lg bg-purple-50/50 space-y-2">
                <Label className="text-xs font-bold text-purple-800">New Category Name *</Label>
                <Input
                  placeholder="e.g. Medical Certificate"
                  className="h-9 text-xs bg-white"
                  value={typeData.name}
                  onChange={(e) => setTypeData({ name: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Document Number / ID (Optional)</Label>
              <Input
                placeholder="e.g. 5598-7654-3212"
                className="h-9 text-xs font-mono"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Upload Document File (PDF/Image) *</Label>
              <Input
                required
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="h-9 text-xs"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Upload to Vault
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Document Type Modal */}
      <Dialog open={isCreatingTypeModalOpen} onOpenChange={setIsCreatingTypeModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <FileCheck className="w-5 h-5" />
              Add Document Category Type
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTypeOnly} className="space-y-4 text-xs mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category Name *</Label>
              <Input
                required
                placeholder="e.g. Tax Declaration Form 16"
                className="h-9 text-xs"
                value={typeData.name}
                onChange={(e) => setTypeData({ name: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreatingTypeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review KYC Status Modal */}
      {editDocument && (
        <Dialog open={!!editDocument} onOpenChange={() => setEditDocument(null)}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
                Review & Verify Employee KYC Document
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-2">
              <div className="p-3 border rounded-lg bg-muted/20 space-y-1">
                <div className="font-bold text-foreground">
                  {editDocument.employee ? `${editDocument.employee.firstName} ${editDocument.employee.lastName}` : "Employee"}
                </div>
                <div className="text-muted-foreground">{editDocument.documentType} • {editDocument.documentNumber || "No Ref"}</div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleApproveKYC(editDocument.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve KYC
                </Button>
              </div>

              <form onSubmit={handleRejectKYC} className="space-y-3 pt-2 border-t">
                <Label className="text-xs font-semibold text-rose-600">Reject KYC Document with Remarks</Label>
                <Textarea
                  rows={2}
                  placeholder="Reason for rejection (e.g. Blurry scan, Expired ID)..."
                  className="text-xs resize-none"
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                />
                <Button type="submit" variant="destructive" className="w-full">
                  Reject Document
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Document Viewer Modal */}
      {viewDocument && (
        <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
          <DialogContent className="sm:max-w-4xl md:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary-foreground font-bold">
                  <FolderLock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    {viewDocument.documentType || "Document Vault Preview"}
                  </h2>
                  <p className="text-xs text-indigo-200/80">
                    Uploaded by {viewDocument.employee ? `${viewDocument.employee.firstName} ${viewDocument.employee.lastName}` : "Employee"} • {viewDocument.employee?.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mr-6">
                {getKYCBadge(viewDocument.verificationStatus)}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 dark:bg-background">
              {/* Employee & Document Details Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-background border rounded-xl shadow-2xs">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">Employee</span>
                  <p className="font-bold text-xs text-foreground mt-0.5 truncate">
                    {viewDocument.employee ? `${viewDocument.employee.firstName} ${viewDocument.employee.lastName}` : "Staff Member"}
                  </p>
                </div>
                <div className="p-3.5 bg-background border rounded-xl shadow-2xs">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">Document Ref / No.</span>
                  <p className="font-bold text-xs text-foreground font-mono mt-0.5 truncate">
                    {viewDocument.documentNumber || viewDocument.encryptedDocumentNumber || "N/A"}
                  </p>
                </div>
                <div className="p-3.5 bg-background border rounded-xl shadow-2xs">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">Category</span>
                  <p className="font-bold text-xs text-foreground capitalize mt-0.5">
                    {viewDocument.category?.toLowerCase() || "Identity"}
                  </p>
                </div>
                <div className="p-3.5 bg-background border rounded-xl shadow-2xs">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">KYC Status</span>
                  <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {viewDocument.verificationStatus || "PENDING"}
                  </p>
                </div>
              </div>

              {/* Main Document Viewer Pane */}
              {(viewDocument.fileUrl || (viewDocument.encryptedDocumentPath && viewDocument.encryptedDocumentPath !== 'HIDDEN')) ? (
                <div className="border rounded-2xl bg-background overflow-hidden shadow-xs space-y-0">
                  {/* Top Viewer Control Toolbar */}
                  <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">Vault Document Preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild className="h-7 text-xs gap-1.5">
                        <a href={viewDocument.fileUrl || viewDocument.encryptedDocumentPath} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-3.5 h-3.5" /> Open Full Tab
                        </a>
                      </Button>
                      <Button size="sm" asChild className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                        <a href={viewDocument.fileUrl || viewDocument.encryptedDocumentPath} download target="_blank" rel="noopener noreferrer">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Document Content Frame */}
                  <div className="w-full bg-slate-900/5 dark:bg-black/20 flex items-center justify-center relative min-h-[520px]">
                    {((viewDocument.mimeType?.includes('image')) || (viewDocument.fileUrl || viewDocument.encryptedDocumentPath)?.match(/\.(png|jpg|jpeg|svg|webp)/i)) ? (
                      <div className="p-4 flex items-center justify-center w-full min-h-[520px]">
                        <img
                          src={viewDocument.fileUrl || viewDocument.encryptedDocumentPath}
                          alt={viewDocument.documentType}
                          className="max-w-full max-h-[600px] object-contain rounded-lg shadow-md border bg-white"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={`${viewDocument.fileUrl || viewDocument.encryptedDocumentPath}#toolbar=1`}
                        className="w-full h-[600px] border-0 rounded-b-xl"
                        title="Document Viewer"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 border border-dashed rounded-2xl bg-background text-center text-muted-foreground space-y-2">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="font-semibold text-foreground text-sm">No File Attachment Found</p>
                  <p className="text-xs text-muted-foreground">This document record has no binary file uploaded.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-background border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                {viewDocument.verificationStatus === 'PENDING' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        const idToApprove = viewDocument.id;
                        setViewDocument(null);
                        handleApproveKYC(idToApprove);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve KYC
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const docToEdit = viewDocument;
                        setViewDocument(null);
                        setEditDocument(docToEdit);
                      }}
                      className="border-rose-300 text-rose-600 hover:bg-rose-50 h-8 text-xs gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject KYC
                    </Button>
                  </>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setViewDocument(null)} className="h-8 px-4 text-xs font-semibold">
                Close Preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
