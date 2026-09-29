"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { extractRoleName } from "@/lib/pagePermissions";
import Link from "next/link";
import {
  Building2,
  Users,
  Search,
  Loader2,
  RefreshCw,
  UserCheck,
  Building,
  Briefcase,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Eye,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Network,
  List,
  UserPlus,
  ArrowRight,
  FolderTree,
  User,
  Sparkles,
  Layers,
  CreditCard,
  PhoneCall,
  MapPin,
  Globe,
  DollarSign
} from "lucide-react";

export function TenantWorkforceClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const roleNameRaw = extractRoleName(user?.role);
  const normalizedRole = roleNameRaw.toUpperCase().trim().replace(/[\s\_]+/g, '_');
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'SUPER_ADMINISTRATOR';

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedEmpModal, setSelectedEmpModal] = useState<any | null>(null);

  // Active Tab inside Employee Profile Modal
  const [modalTab, setModalTab] = useState<"job" | "personal" | "contact" | "bank" | "tenant">("job");

  // View Mode: "tree" (Default Hierarchical View) or "table" (Flat Directory Table)
  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");

  // Expanded Tree Nodes tracking
  const [expandedTenants, setExpandedTenants] = useState<Record<string, boolean>>({});

  // Fetch Tenant Workforce Data (Only enabled if Super Admin)
  const { data: workforceRes, isLoading, refetch } = useQuery({
    queryKey: ["admin_tenant_employees"],
    queryFn: async () => (await api.get("/admin/tenant-employees")).data,
    enabled: isSuperAdmin
  });

  const workforceData = workforceRes?.data || {
    summary: { totalTenants: 0, totalEmployees: 0, activeEmployees: 0, avgPerTenant: 0 },
    tenants: [],
    tree: [],
    employees: [],
  };

  const summary = workforceData.summary;
  const tenants = workforceData.tenants || [];
  const rawTree = workforceData.tree || [];
  const employees = workforceData.employees || [];

  // Dynamically build/resolve tree structure from backend data
  const treeNodes = useMemo(() => {
    // 1. If backend tree is provided with employees
    if (Array.isArray(rawTree) && rawTree.length > 0 && rawTree.some((n: any) => n.employees && n.employees.length > 0)) {
      return rawTree;
    }

    // 2. Fallback: Build tree dynamically from employees & tenants
    const map = new Map<string, any>();

    // Seed from tenants list
    tenants.forEach((tGroup: any) => {
      map.set(tGroup.companyName, {
        companyName: tGroup.companyName,
        headName: tGroup.headName || "System Admin",
        headEmail: tGroup.headEmail || "",
        headRole: tGroup.headRole || "Corporate Professional / HR Admin",
        count: tGroup.count || 0,
        activeCount: tGroup.activeCount || 0,
        employees: []
      });
    });

    // Populate employees array into corresponding tenant group
    employees.forEach((emp: any) => {
      const comp = emp.tenantCompany || "Default Enterprise Tenant";
      if (!map.has(comp)) {
        map.set(comp, {
          companyName: comp,
          headName: emp.tenantHead || "System Admin",
          headEmail: emp.creatorEmail || "",
          headRole: emp.creatorRole || "Corporate Professional / HR Admin",
          count: 0,
          activeCount: 0,
          employees: []
        });
      }
      map.get(comp).employees.push(emp);
    });

    return Array.from(map.values());
  }, [rawTree, tenants, employees]);

  // Filtered Tree Structure according to Search / Tenant / Status
  const filteredTree = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    const isUnfiltered = !searchLower && selectedTenant === "ALL" && statusFilter === "ALL";

    return treeNodes.map((tenantNode: any) => {
      // Filter employees inside tenant node
      const matchingEmployees = (tenantNode.employees || []).filter((emp: any) => {
        const matchesSearch =
          !searchLower ||
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchLower) ||
          emp.employeeId.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower) ||
          emp.tenantCompany.toLowerCase().includes(searchLower);

        const matchesTenant = selectedTenant === "ALL" || emp.tenantCompany === selectedTenant;
        const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;

        return matchesSearch && matchesTenant && matchesStatus;
      });

      const matchesTenantFilter = selectedTenant === "ALL" || tenantNode.companyName === selectedTenant;

      return {
        ...tenantNode,
        matchingEmployees: isUnfiltered ? (tenantNode.employees || []) : matchingEmployees,
        shouldDisplay: isUnfiltered ? matchesTenantFilter : (matchesTenantFilter && matchingEmployees.length > 0)
      };
    }).filter((tNode: any) => tNode.shouldDisplay);
  }, [treeNodes, searchTerm, selectedTenant, statusFilter]);

  // Filtered flat employees for Table view
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: any) => {
      const searchLower = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchLower) ||
        emp.employeeId.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.tenantCompany.toLowerCase().includes(searchLower);

      const matchesTenant = selectedTenant === "ALL" || emp.tenantCompany === selectedTenant;
      const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;

      return matchesSearch && matchesTenant && matchesStatus;
    });
  }, [employees, searchTerm, selectedTenant, statusFilter]);

  // Toggle single tenant node
  const toggleTenantNode = (companyName: string) => {
    setExpandedTenants(prev => ({
      ...prev,
      [companyName]: !(prev[companyName] ?? true) // Default open
    }));
  };

  // Expand / Collapse all nodes
  const expandAllNodes = () => {
    const expanded: Record<string, boolean> = {};
    treeNodes.forEach((t: any) => {
      expanded[t.companyName] = true;
    });
    setExpandedTenants(expanded);
  };

  const collapseAllNodes = () => {
    setExpandedTenants({});
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTenant("ALL");
    setStatusFilter("ALL");
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-5 text-center p-8 bg-card border rounded-2xl shadow-xs max-w-2xl mx-auto my-12">
        <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shadow-xs">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 text-xs font-mono">
            403 FORBIDDEN • SUPER ADMIN ONLY
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Access Restricted</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            The Tenant Workforce Directory is exclusively reserved for Super Admin accounts. HR Admins and standard user accounts are not permitted to view global tenant employee structures.
          </p>
        </div>
        <Link href="/dashboard">
          <Button size="sm" className="h-9 px-5 text-xs font-semibold gap-2 shadow-xs">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <PageHeader
        title={t("Tenant Workforce Hierarchy")}
        description={t("Super Admin multi-tenant tree directory: Tenants, HR Heads, and created workforce.")}
        showCreate={false}
        showSearch={false}
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tenant Companies
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">Enterprise account tenants</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Workforce
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Total created employees</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Workforce
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{summary.activeEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Active staff members</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Staff / Tenant
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgPerTenant}</div>
            <p className="text-xs text-muted-foreground mt-1">Average per company</p>
          </CardContent>
        </Card>
      </div>

      {/* View Switcher & Toolbar */}
      <div className="bg-card border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* View Mode Selector */}
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "tree"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" />
              <span>Tree Hierarchy</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Flat Table</span>
            </button>
          </div>

          {/* Company Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenant:</span>
            <select
              className="h-9 px-3 border rounded-lg text-xs bg-background font-medium focus:ring-2 focus:ring-primary min-w-[180px]"
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
            >
              <option value="ALL">All Enterprise Tenants ({tenants.length})</option>
              {tenants.map((tGroup: any, idx: number) => (
                <option key={idx} value={tGroup.companyName}>
                  {tGroup.companyName} ({tGroup.count})
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
            <select
              className="h-9 px-3 border rounded-lg text-xs bg-background font-medium focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee name, ID, or tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "tree" && (
            <>
              <Button variant="ghost" size="sm" onClick={expandAllNodes} className="h-8 text-xs">
                Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAllNodes} className="h-8 text-xs">
                Collapse All
              </Button>
            </>
          )}

          {(selectedTenant !== "ALL" || statusFilter !== "ALL" || searchTerm) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 text-xs text-destructive">
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* 🌳 VIEW MODE 1: HIERARCHICAL TREE VIEW */}
      {/* ======================================= */}
      {viewMode === "tree" && (
        <div className="space-y-6">
          {isLoading ? (
            <Card className="border shadow-xs">
              <CardContent className="py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <span className="text-xs text-muted-foreground mt-2 block">Loading tenant tree hierarchy...</span>
              </CardContent>
            </Card>
          ) : filteredTree.length === 0 ? (
            <Card className="border shadow-xs">
              <CardContent className="py-16 text-center space-y-2">
                <FolderTree className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium">No tenant workforce matching current filters.</p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs mt-2">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTree.map((tenantNode: any, tenantIdx: number) => {
              const isExpanded = expandedTenants[tenantNode.companyName] ?? true; // default open
              const matchedEmployees = tenantNode.matchingEmployees || [];

              return (
                <Card key={tenantIdx} className="border shadow-sm overflow-hidden bg-card transition-all">
                  {/* ROOT LEVEL 1: TENANT / COMPANY HEADER NODE */}
                  <div
                    onClick={() => toggleTenantNode(tenantNode.companyName)}
                    className="p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer border-b flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs font-bold text-sm">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-foreground tracking-tight">
                              {tenantNode.companyName}
                            </h3>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[11px]">
                              Enterprise Tenant
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>Head / HR Admin: <strong>{tenantNode.headName}</strong></span>
                            {tenantNode.headEmail && <span>• {tenantNode.headEmail}</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
                        {tenantNode.count} Total Employees
                      </Badge>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs px-2.5 py-1">
                        {tenantNode.activeCount} Active
                      </Badge>
                    </div>
                  </div>

                  {/* EXPANDABLE BODY: LEVEL 2 & LEVEL 3 */}
                  {isExpanded && (
                    <div className="p-5 space-y-4 bg-background/50">
                      {/* LEVEL 2: TENANT HEAD / CORPORATE PROFESSIONAL CARD */}
                      <div className="relative pl-6 ml-4 border-l-2 border-primary/20 space-y-4">
                        <div className="absolute -left-[9px] top-3 h-4 w-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>

                        <div className="p-3.5 rounded-xl border bg-card shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                              <UserCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-foreground">{tenantNode.headName}</span>
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0 text-[10px] uppercase font-mono">
                                  {tenantNode.headRole || "Corporate Professional / HR Admin"}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-muted-foreground block mt-0.5">
                                Primary HR Admin & Creator of {tenantNode.companyName} workforce
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-semibold text-foreground block">
                              {matchedEmployees.length} Workforce Accounts
                            </span>
                            <span className="text-[10px] text-muted-foreground">Directly Created</span>
                          </div>
                        </div>

                        {/* LEVEL 3: EMPLOYEES GRID / WORKFORCE UNDER THIS HR HEAD */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1 pt-1">
                            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              Created Employees under {tenantNode.headName} ({matchedEmployees.length})
                            </span>
                          </div>

                          {matchedEmployees.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                              No employees found matching filter criteria under this tenant.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                              {matchedEmployees.map((emp: any) => (
                                <div
                                  key={emp.id}
                                  className="p-3.5 rounded-xl border bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between space-y-3 group"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                                        {emp.firstName?.charAt(0) || "E"}
                                      </div>
                                      <div className="truncate">
                                        <h5 className="font-bold text-xs text-foreground truncate">
                                          {emp.firstName} {emp.lastName}
                                        </h5>
                                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                                          {emp.employeeId}
                                        </p>
                                      </div>
                                    </div>

                                    {emp.status === "ACTIVE" ? (
                                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-[10px] px-1.5 py-0">
                                        Active
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {emp.status}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="space-y-1 text-[11px] text-muted-foreground border-t pt-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-foreground">
                                        {emp.designation?.name || "Corporate Professional"}
                                      </span>
                                      <span>{emp.department?.name || "Operations"}</span>
                                    </div>
                                    <div className="truncate text-muted-foreground text-[10px]">
                                      {emp.email}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1 border-t text-[11px]">
                                    <span className="text-[10px] text-muted-foreground">
                                      Joined: {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "N/A"}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => { setSelectedEmpModal(emp); setModalTab("job"); }}
                                      className="h-7 px-2 text-[11px] gap-1 hover:text-primary"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Details
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* 📋 VIEW MODE 2: FLAT DIRECTORY TABLE   */}
      {/* ======================================= */}
      {viewMode === "table" && (
        <Card className="border shadow-xs">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[120px]">Employee ID</TableHead>
                  <TableHead>Employee Details</TableHead>
                  <TableHead>Tenant Company</TableHead>
                  <TableHead>Tenant Head / HR</TableHead>
                  <TableHead>Role & Department</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <span className="text-xs text-muted-foreground mt-2 block">Loading workforce directory...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground space-y-2">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
                      <p className="text-sm font-medium">No employees found matching filter criteria.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp: any) => (
                    <TableRow key={emp.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {emp.employeeId}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.firstName?.charAt(0) || "E"}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">{emp.email}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-medium gap-1 py-0.5">
                          <Building2 className="h-3 w-3" />
                          {emp.tenantCompany}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <UserCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="font-semibold text-foreground">{emp.tenantHead}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            {emp.designation?.name || "Corporate Professional"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {emp.department?.name || "General Operations"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "N/A"}
                      </TableCell>

                      <TableCell>
                        {emp.status === "ACTIVE" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {emp.status}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => { setSelectedEmpModal(emp); setModalTab("job"); }}
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Comprehensive Enterprise Employee Details Modal */}
      {selectedEmpModal && (
        <Dialog open={!!selectedEmpModal} onOpenChange={() => setSelectedEmpModal(null)}>
          <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Banner */}
            <div className="p-6 bg-muted/40 border-b relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-xl shadow-md border-2 border-background">
                    {selectedEmpModal.firstName?.charAt(0) || "E"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold tracking-tight text-foreground">
                        {selectedEmpModal.firstName} {selectedEmpModal.lastName}
                      </h3>
                      {selectedEmpModal.status === "ACTIVE" ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs px-2.5 py-0.5 font-bold">
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-bold">
                          {selectedEmpModal.status}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-semibold text-foreground">{selectedEmpModal.designation?.name || "Corporate Professional"}</span>
                      <span>•</span>
                      <span className="font-mono text-primary font-bold">{selectedEmpModal.employeeId}</span>
                    </p>

                    <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        {selectedEmpModal.tenantCompany}
                      </span>
                      <span>(Tenant Head: <strong>{selectedEmpModal.tenantHead}</strong>)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="flex items-center gap-1.5 border-t pt-3 mt-5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setModalTab("job")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === "job"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Job Details
                </button>
                <button
                  onClick={() => setModalTab("personal")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === "personal"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  Personal Info
                </button>
                <button
                  onClick={() => setModalTab("contact")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === "contact"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  Contact & Emergency
                </button>
                <button
                  onClick={() => setModalTab("bank")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === "bank"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Bank & Payroll
                </button>
                <button
                  onClick={() => setModalTab("tenant")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === "tenant"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Building className="h-3.5 w-3.5" />
                  Tenant Company
                </button>
              </div>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* TAB 1: JOB DETAILS */}
              {modalTab === "job" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Job & Position Details
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Employee ID</span>
                      <span className="font-bold text-foreground font-mono text-sm">{selectedEmpModal.employeeId}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Department</span>
                      <span className="font-bold text-foreground">{selectedEmpModal.department?.name || "Software Engineering"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Designation Title</span>
                      <span className="font-bold text-foreground">{selectedEmpModal.designation?.name || "Corporate Professional"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Employment Type</span>
                      <Badge variant="outline" className="font-mono text-xs uppercase font-bold text-primary">
                        {selectedEmpModal.employmentType || "FULL TIME"}
                      </Badge>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Joining Date</span>
                      <span className="font-bold text-foreground font-mono">
                        {selectedEmpModal.joiningDate ? new Date(selectedEmpModal.joiningDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Base Salary (CTC)</span>
                      <span className="font-bold text-emerald-600 font-mono text-sm">
                        ₹{Number(selectedEmpModal.baseSalary || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1 col-span-2">
                      <span className="text-muted-foreground font-medium block">Reporting Manager</span>
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        {selectedEmpModal.manager ? (
                          <>
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                            {selectedEmpModal.manager.firstName} {selectedEmpModal.manager.lastName} ({selectedEmpModal.manager.employeeId})
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">— No Manager Assigned —</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONAL INFORMATION */}
              {modalTab === "personal" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                    <User className="h-4 w-4 text-primary" />
                    Personal Information & Demographics
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">First Name</span>
                      <span className="font-bold text-foreground">{selectedEmpModal.firstName}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Last Name</span>
                      <span className="font-bold text-foreground">{selectedEmpModal.lastName}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Gender</span>
                      <span className="font-semibold text-foreground">{selectedEmpModal.gender || "Male"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Date of Birth</span>
                      <span className="font-semibold text-foreground font-mono">
                        {selectedEmpModal.dob ? new Date(selectedEmpModal.dob).toLocaleDateString() : "—"}
                      </span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Blood Group</span>
                      <span className="font-semibold text-foreground">{selectedEmpModal.bloodGroup || "O+"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Marital Status</span>
                      <span className="font-semibold text-foreground">{selectedEmpModal.maritalStatus || "Single"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1 col-span-2">
                      <span className="text-muted-foreground font-medium block">Nationality</span>
                      <span className="font-semibold text-foreground">{selectedEmpModal.nationality || "Indian"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTACT & EMERGENCY */}
              {modalTab === "contact" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                    <PhoneCall className="h-4 w-4 text-primary" />
                    Contact & Communication
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Email Address</span>
                      <span className="font-bold text-foreground font-mono truncate block">{selectedEmpModal.email}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Mobile Number</span>
                      <span className="font-semibold text-foreground font-mono">{selectedEmpModal.phone || "—"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Alternate Phone</span>
                      <span className="font-semibold text-foreground font-mono">{selectedEmpModal.alternatePhone || "—"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">City / State</span>
                      <span className="font-semibold text-foreground">
                        {selectedEmpModal.city || "—"}, {selectedEmpModal.state || "—"}
                      </span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1 col-span-2">
                      <span className="text-muted-foreground font-medium block">Residential Address</span>
                      <span className="font-semibold text-foreground">
                        {selectedEmpModal.address || "—"} {selectedEmpModal.postalCode ? `(${selectedEmpModal.postalCode})` : ""}
                      </span>
                    </div>
                  </div>

                  {/* EMERGENCY CONTACT BOX */}
                  <div className="p-4 border rounded-xl bg-destructive/5 border-destructive/20 space-y-3 mt-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      Emergency Contact Details
                    </h5>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Contact Name</span>
                        <span className="font-bold text-foreground">
                          {selectedEmpModal.emergencyContactName || selectedEmpModal.emergencyContact || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted-foreground block">Relationship</span>
                        <span className="font-bold text-foreground">
                          {selectedEmpModal.emergencyContactRelation || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted-foreground block">Emergency Phone</span>
                        <span className="font-bold text-foreground font-mono">
                          {selectedEmpModal.emergencyContactPhone || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BANK & PAYROLL */}
              {modalTab === "bank" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Bank Account & Salary Transfer Credentials
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Bank Name</span>
                      <span className="font-bold text-foreground">{selectedEmpModal.bankName || "—"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Account Number</span>
                      <span className="font-bold text-foreground font-mono">{selectedEmpModal.accountNumber || "—"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">IFSC Code</span>
                      <span className="font-bold text-foreground font-mono uppercase">{selectedEmpModal.ifsc || "—"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">UPI ID (Optional)</span>
                      <span className="font-bold text-foreground font-mono">{selectedEmpModal.upiId || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TENANT COMPANY DETAILS */}
              {modalTab === "tenant" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                    <Building className="h-4 w-4 text-primary" />
                    Enterprise Tenant & HR Creator Information
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Tenant Company Name</span>
                      <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-primary" />
                        {selectedEmpModal.tenantCompany}
                      </span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Creator HR Head</span>
                      <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-amber-600" />
                        {selectedEmpModal.tenantHead}
                      </span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">HR Email</span>
                      <span className="font-bold text-foreground font-mono">{selectedEmpModal.creatorEmail || "—"}</span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1">
                      <span className="text-muted-foreground font-medium block">Company Website</span>
                      <span className="font-bold text-primary font-mono truncate block">
                        {selectedEmpModal.creatorWebsite || "—"}
                      </span>
                    </div>

                    <div className="p-3.5 border rounded-xl bg-card space-y-1 col-span-2">
                      <span className="text-muted-foreground font-medium block">Headquarters Address</span>
                      <span className="font-semibold text-foreground">
                        {selectedEmpModal.creatorAddress || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/40 border-t flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedEmpModal(null)} className="text-xs font-semibold px-5">
                Close Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
