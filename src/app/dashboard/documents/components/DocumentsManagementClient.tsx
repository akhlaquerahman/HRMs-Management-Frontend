"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import api from "@/lib/axios";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";

import { DocumentsKPICards } from './DocumentsKPICards';
import { DocumentsFilterToolbar } from './DocumentsFilterToolbar';
import { DocumentsTable } from './DocumentsTable';

export function DocumentsManagementClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [viewDocument, setViewDocument] = useState<any>(null);
  const [editDocument, setEditDocument] = useState<any>(null);

  const [filters, setFilters] = useState({ search: "", typeFilter: "ALL", statusFilter: "ALL" });

  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    employeeId: "",
    documentTypeId: "",
    documentNumber: ""
  });

  const [isCreatingType, setIsCreatingType] = useState(false);
  const [typeData, setTypeData] = useState({ name: "" });

  const { data: documentsRes, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => (await api.get("/documents")).data,
  });

  const { data: employeesRes } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get("/employees")).data,
  });

  const { data: documentTypesRes } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: async () => (await api.get("/documents/types")).data,
  });

  const documents = documentsRes?.data || [];
  const employees = Array.isArray(employeesRes?.data) ? employeesRes.data : (employeesRes?.data?.data || []);
  const documentTypes = documentTypesRes?.data || [];

  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = doc.employee?.firstName?.toLowerCase().includes(filters.search.toLowerCase()) || 
                          doc.employee?.lastName?.toLowerCase().includes(filters.search.toLowerCase()) ||
                          doc.employee?.email?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = filters.typeFilter === "ALL" || doc.documentTypeId === filters.typeFilter;
    const matchesStatus = filters.statusFilter === "ALL" || doc.verificationStatus === filters.statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate KPIs
  const totalDocuments = documents.length;
  const pendingDocs = documents.filter((d: any) => d.verificationStatus === 'PENDING').length;
  const approvedDocs = documents.filter((d: any) => d.verificationStatus === 'APPROVED').length;
  const rejectedDocs = documents.filter((d: any) => d.verificationStatus === 'REJECTED').length;

  const kpiMetrics = [
    { title: "Total Documents", value: totalDocuments, subtitle: "All Uploads", icon: "FileText" },
    { title: "Pending Verification", value: pendingDocs, subtitle: "Action Required", icon: "Clock" },
    { title: "Approved KYC", value: approvedDocs, subtitle: "Verified", icon: "CheckCircle" },
    { title: "Rejected Documents", value: rejectedDocs, subtitle: "Needs Review", icon: "XCircle" },
  ];

  const handleFilterChange = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", typeFilter: "ALL", statusFilter: "ALL" });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalTypeId = formData.documentTypeId;
      
      if (formData.documentTypeId === "new_type") {
        if (!typeData.name) {
          alert("Please enter a new document type name.");
          setIsSubmitting(false);
          return;
        }
        const newType = await api.post("/documents/types", typeData);
        finalTypeId = newType.data.data.name;
      } else {
        const selectedType = documentTypes.find((t: any) => t.id === formData.documentTypeId);
        finalTypeId = selectedType?.name || formData.documentTypeId;
      }

      if (!file) {
        alert("Please select a file to upload");
        setIsSubmitting(false);
        return;
      }

      const uploadData = new FormData();
      uploadData.append("employeeId", formData.employeeId);
      uploadData.append("documentType", finalTypeId);
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
      setTypeData({ name: "" });
      setIsCreatingType(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editDocument.verificationStatus === 'APPROVED') {
        await api.post(`/documents/${editDocument.id}/approve`);
      } else if (editDocument.verificationStatus === 'REJECTED') {
        await api.post(`/documents/${editDocument.id}/reject`, { remarks: "Rejected by HR Admin" });
      }
      // If we just want to update status back to PENDING or update number, we can use a PUT request if available. 
      // For now we rely on the specific approve/reject endpoints, assuming the backend supports them.
      
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setEditDocument(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to update document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await api.delete(`/documents/${id}`);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      } catch (error: any) {
        alert(error?.response?.data?.message || "Failed to delete");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="KYC & Documents" 
        description="Manage employee KYC verification and important documents."
        showSearch={false}
        showCreate={false}
        showExport={false}
        showImport={false}
        showFilters={false}
      />

      <DocumentsKPICards metrics={kpiMetrics} loading={isLoadingDocs} />

      <div className="grid grid-cols-1 gap-6">
        <DocumentsFilterToolbar 
          onSearch={(v) => handleFilterChange('search', v)}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          documentTypes={documentTypes}
          onCreateClick={() => setIsCreating(true)}
        />
        <DocumentsTable 
          data={filteredDocuments}
          loading={isLoadingDocs}
          onView={(d) => setViewDocument(d)}
          onEdit={(d) => setEditDocument(d)}
          onDelete={(id) => handleDelete(id)}
        />
      </div>

      <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Upload New Document")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">{t("Employee")}</label>
              <select 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.employeeId} 
                onChange={e => setFormData({...formData, employeeId: e.target.value})}
              >
                <option value="" disabled>{t("Select Employee")}</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Document Type")}</label>
              <select 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.documentTypeId} 
                onChange={e => {
                  const val = e.target.value;
                  setFormData({...formData, documentTypeId: val});
                  setIsCreatingType(val === "new_type");
                }}
              >
                <option value="" disabled>{t("Select Document Type")}</option>
                {documentTypes.map((type: any) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
                <option value="new_type" className="font-bold text-primary">+ {t("Others / New Type")}</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t("Document Number (Optional)")}</label>
              <Input placeholder="e.g. ABCDE1234F" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value})} />
            </div>

            {isCreatingType && (
              <div className="md:col-span-2 p-4 border rounded-md bg-muted/30 flex flex-col gap-4">
                <h4 className="font-medium text-sm text-primary flex items-center"><FileText className="w-4 h-4 mr-2"/> Define New Document Type</h4>
                <div>
                  <label className="text-xs font-medium mb-1 block">{t("Type Name")}</label>
                  <Input required placeholder="e.g. Driving License" value={typeData.name} onChange={e => setTypeData({...typeData, name: e.target.value})} />
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">{t("Upload Document")}</label>
              <input 
                type="file" 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                accept="image/*,.pdf"
              />
              <p className="text-xs text-muted-foreground mt-1">Supported formats: Images and PDFs.</p>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>{t("Cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t("Uploading...") : t("Upload Document")}</Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewDocument} onOpenChange={(open) => !open && setViewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Document Verification Viewer")}</DialogTitle>
          </DialogHeader>
          {viewDocument && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold">{viewDocument.employee?.firstName} {viewDocument.employee?.lastName}</h2>
                  <p className="text-muted-foreground">{viewDocument.employee?.email}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                    viewDocument.verificationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                    viewDocument.verificationStatus === 'REJECTED' ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                    'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    KYC: {viewDocument.verificationStatus}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md">
                <div>
                  <label className="text-xs text-muted-foreground block">{t("Document Type")}</label>
                  <p className="font-semibold text-lg">{viewDocument.documentType}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block">{t("Document Number")}</label>
                  <p className="font-mono text-lg">{viewDocument.encryptedDocumentNumber || "Not Provided"}</p>
                </div>
              </div>
              
              <div className="border-2 border-dashed rounded-lg p-2 bg-black/5 flex items-center justify-center min-h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {viewDocument.encryptedDocumentPath?.match(/\.pdf$/i) ? (
                  <iframe 
                    src={viewDocument.encryptedDocumentPath?.startsWith('http') ? viewDocument.encryptedDocumentPath.replace('http://', 'https://') : process.env.NEXT_PUBLIC_API_URL + viewDocument.encryptedDocumentPath}
                    className="w-full h-[600px] rounded shadow-sm border-0"
                  />
                ) : (
                  <img 
                    src={viewDocument.encryptedDocumentPath?.startsWith('http') ? viewDocument.encryptedDocumentPath.replace('http://', 'https://') : process.env.NEXT_PUBLIC_API_URL + viewDocument.encryptedDocumentPath} 
                    alt="Document Preview" 
                    className="max-w-full max-h-[600px] object-contain rounded shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Invalid+Image+URL+or+Format';
                    }}
                  />
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDocument(null)}>{t("Close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editDocument} onOpenChange={(open) => !open && setEditDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Edit Document / KYC Status")}</DialogTitle>
          </DialogHeader>
          {editDocument && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t("KYC Status")}</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={editDocument.verificationStatus} 
                  onChange={e => setEditDocument({...editDocument, verificationStatus: e.target.value})}
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t("Document Number")}</label>
                <Input value={editDocument.encryptedDocumentNumber || ""} onChange={e => setEditDocument({...editDocument, encryptedDocumentNumber: e.target.value})} />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditDocument(null)}>{t("Cancel")}</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t("Saving...") : t("Save Changes")}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
