"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Briefcase,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  Eye,
  Power,
  UserCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Network,
  List,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/store/authStore";

interface Designation {
  id: string;
  name: string;
  code: string | null;
  level: string;
  status: boolean;
  employeeCount: number;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: boolean;
  employeeCount: number;
  designationCount: number;
  createdAt?: string;
  updatedAt?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    name?: string;
    employeeId: string;
    email?: string;
    designation?: string | null;
  } | null;
  designations: Designation[];
}

interface OrgChartTreeProps {
  departments: Department[];
  totalEmployees?: number;
  companyName?: string;
  onViewDetails: (dept: Department) => void;
  onEditDepartment: (dept: Department) => void;
  onDeleteDepartment: (dept: Department | string, name?: string) => void;
  onAssignManager: (dept: Department) => void;
  onAddDesignation: (deptId: string) => void;
  onEditDesignation: (desig: Designation) => void;
  onDeleteDesignation: (desig: Designation | string, name?: string) => void;
  onToggleDeptStatus: (dept: Department) => void;
  onOpenDirectory?: (deptId?: string | null, desigId?: string | null) => void;
}

export function OrgChartTree({
  departments = [],
  totalEmployees = 0,
  companyName,
  onViewDetails,
  onEditDepartment,
  onDeleteDepartment,
  onAssignManager,
  onAddDesignation,
  onEditDesignation,
  onDeleteDesignation,
  onToggleDeptStatus,
  onOpenDirectory,
}: OrgChartTreeProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const activeCompanyName = user?.companyName || companyName || "Mobiloitte";

  const safeDepartments = Array.isArray(departments) ? departments : [];

  const [viewMode, setViewMode] = useState<"chart" | "list">("chart");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    safeDepartments.forEach((d) => {
      if (d?.id) initial[d.id] = true;
    });
    return initial;
  });

  const toggleDept = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 0.6), 1.4));
  };

  const handleOpenDirectoryView = (deptId?: string | null, desigId?: string | null) => {
    if (onOpenDirectory) {
      onOpenDirectory(deptId, desigId);
    } else if (deptId) {
      router.push(`/dashboard/employee-management?department=${deptId}`);
    } else {
      router.push(`/dashboard/employee-management`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & View Mode Bar */}
      <div className="bg-card border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">{activeCompanyName} - Visual Org Hierarchy</h3>
            <p className="text-xs text-muted-foreground">
              {safeDepartments.length} Departments • {totalEmployees} Total Employees
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-muted p-1 rounded-lg border">
            <button
              onClick={() => setViewMode("chart")}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "chart"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              Visual Tree Chart
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List View
            </button>
          </div>

          {/* Zoom Controls for Visual Tree */}
          {viewMode === "chart" && (
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md border text-xs">
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-semibold text-muted-foreground">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-foreground ml-1"
                title="Reset Zoom"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 font-semibold h-9"
            onClick={() => handleOpenDirectoryView(null, null)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Full Canvas View
          </Button>
        </div>
      </div>

      {safeDepartments.length === 0 ? (
        <div className="p-12 border rounded-xl bg-card text-center text-muted-foreground space-y-3">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm font-medium">No departments found in organization structure.</p>
        </div>
      ) : viewMode === "chart" ? (
        /* VISUAL TREE CHART VIEW ON MAIN PAGE */
        <div className="border rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-6 overflow-x-auto custom-scrollbar shadow-inner min-h-[500px]">
          <div
            className="min-w-max p-4 flex flex-col items-center transition-transform origin-top duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* LEVEL 0: ROOT COMPANY NODE */}
            <div className="flex flex-col items-center">
              <div className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex items-center gap-3.5 border border-blue-400/30">
                <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-tight">{activeCompanyName}</h3>
                  <p className="text-xs text-blue-100 font-medium">
                    {safeDepartments.length} Departments • {totalEmployees} Total Employees
                  </p>
                </div>
              </div>

              {/* Vertical Stem Line from Company Root */}
              <div className="w-0.5 h-8 bg-blue-500/40"></div>
            </div>

            {/* LEVEL 1: DEPARTMENTS BRANCHES */}
            <div className="flex items-start justify-center gap-8 relative pt-2">
              {/* Horizontal Connecting Rail Line */}
              {safeDepartments.length > 1 && (
                <div className="absolute top-0 left-[160px] right-[160px] h-0.5 bg-blue-500/40"></div>
              )}

              {safeDepartments.map((dept) => {
                if (!dept) return null;
                const isDeptExpanded = expandedNodes[dept.id] ?? true;

                const deptDesignations = Array.isArray(dept.designations) ? dept.designations : [];
                const activeManager = (dept as any).resolvedManager || dept.manager;
                const managerName = activeManager
                  ? activeManager.name || `${activeManager.firstName} ${activeManager.lastName}`
                  : null;

                return (
                  <div key={dept.id} className="flex flex-col items-center relative min-w-[300px] max-w-[340px]">
                    {/* Drop Vertical Line from Rail */}
                    <div className="w-0.5 h-6 bg-blue-500/40"></div>

                    {/* DEPARTMENT NODE CARD */}
                    <div className="w-full bg-card border-2 border-blue-500/30 rounded-xl p-4 shadow-md hover:border-blue-500 transition-all flex flex-col justify-between">
                      <div>
                        {/* Header: Dept Name & Expand toggle */}
                        <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{dept.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {dept.code && (
                                  <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                                    {dept.code}
                                  </Badge>
                                )}
                                {dept.status ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-[10px] py-0 px-1.5">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleDept(dept.id)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
                            title={isDeptExpanded ? "Collapse Designations" : "Expand Designations"}
                          >
                            {isDeptExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </div>

                        {/* Department Head / Manager Badge */}
                        <div className="mt-2.5 pt-1 text-xs">
                          {activeManager ? (
                            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-2 rounded-lg font-medium">
                              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                              <div className="flex flex-col truncate">
                                <span className="font-semibold text-xs leading-tight truncate">{managerName}</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                  Dept Head ({activeManager.employeeId})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-1.5 border border-dashed rounded-md text-[11px] text-muted-foreground italic">
                              <span>No Manager Assigned</span>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-[11px] text-primary font-semibold ml-1"
                                onClick={() => onAssignManager(dept)}
                              >
                                [Assign]
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Counts Metrics */}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                          <span className="font-semibold text-foreground">{deptDesignations.length} Designations</span>
                          <Badge variant="secondary" className="font-semibold text-[10px]">
                            {dept.employeeCount || 0} Employees
                          </Badge>
                        </div>
                      </div>

                      {/* ACTION BAR: Direct + Add Designation button on Department Node */}
                      <div className="mt-3 pt-2.5 border-t flex items-center justify-between gap-1.5">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 font-medium px-3 flex-1"
                          onClick={() => onAddDesignation(dept.id)}
                          title={`Add designation to ${dept.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Designation
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2"
                          onClick={() => handleOpenDirectoryView(dept.id, null)}
                          title="View employees in this department"
                        >
                          <Users className="h-3.5 w-3.5" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => onViewDetails(dept)} className="gap-2 text-xs">
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              View Department Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditDepartment(dept)} className="gap-2 text-xs">
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              Edit Department
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAssignManager(dept)} className="gap-2 text-xs">
                              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                              Assign / Change Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddDesignation(dept.id)} className="gap-2 text-xs">
                              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                              Add Designation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDirectoryView(dept.id, null)} className="gap-2 text-xs">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              View Employees Directory
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleDeptStatus(dept)} className="gap-2 text-xs">
                              <Power className="h-3.5 w-3.5 text-muted-foreground" />
                              {dept.status ? "Deactivate Department" : "Activate Department"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteDepartment(dept)}
                              className="gap-2 text-xs text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Department
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* LEVEL 2: DESIGNATION CHILD BRANCHES */}
                    {isDeptExpanded && (
                      <div className="flex flex-col items-center w-full">
                        {/* Stem down from Department Card */}
                        <div className="w-0.5 h-6 bg-blue-500/40"></div>

                        {deptDesignations.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground italic p-2.5 border border-dashed rounded-lg bg-card w-[92%] text-center">
                            No child designations created yet
                          </div>
                        ) : (
                          <div className="space-y-3 w-full flex flex-col items-center">
                            {deptDesignations.map((desig) => {
                              if (!desig) return null;

                              return (
                                <div key={desig.id} className="flex flex-col items-center w-full">
                                  {/* DESIGNATION NODE CARD */}
                                  <div className="w-[92%] bg-card border rounded-lg p-3 shadow-xs hover:border-primary/40 transition-all border-l-4 border-l-primary">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 truncate">
                                        <Briefcase className="h-4 w-4 text-primary shrink-0" />
                                        <div className="truncate">
                                          <h5 className="font-bold text-xs text-foreground truncate">{desig.name}</h5>
                                          {desig.code && (
                                            <span className="text-[10px] font-mono text-muted-foreground block">
                                              {desig.code}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {desig.level && (
                                          <Badge variant="outline" className="text-[10px] py-0 px-1">
                                            Grade L{desig.level}
                                          </Badge>
                                        )}
                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-semibold">
                                          {desig.employeeCount || 0} emps
                                        </Badge>

                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                              <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => onEditDesignation(desig)} className="gap-2 text-xs">
                                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                              Edit Designation
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleOpenDirectoryView(dept.id, desig.id)}
                                              className="gap-2 text-xs"
                                            >
                                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                              View Employees
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => onDeleteDesignation(desig)}
                                              className="gap-2 text-xs text-destructive focus:text-destructive"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                              Delete Designation
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* COMPACT LIST VIEW FALLBACK */
        <div className="space-y-4">
          {safeDepartments.map((dept) => {
            if (!dept) return null;
            const isExpanded = expandedNodes[dept.id] ?? true;
            const deptDesignations = Array.isArray(dept.designations) ? dept.designations : [];
            const activeManager = (dept as any).resolvedManager || dept.manager;
            const managerName = activeManager
              ? activeManager.name || `${activeManager.firstName} ${activeManager.lastName}`
              : null;

            return (
              <div key={dept.id} className="bg-card border rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleDept(dept.id)}
                      className="p-1 mt-0.5 rounded hover:bg-muted text-muted-foreground"
                    >
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>

                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base">{dept.name}</span>
                        {dept.code && <Badge variant="outline" className="text-xs font-mono">{dept.code}</Badge>}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground font-medium">Manager:</span>
                        {activeManager ? (
                          <span className="font-semibold text-foreground">{managerName} ({activeManager.employeeId})</span>
                        ) : (
                          <span className="text-muted-foreground italic">No manager assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => onAddDesignation(dept.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Designation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleOpenDirectoryView(dept.id, null)}
                    >
                      <Users className="h-3.5 w-3.5" />
                      View Employees
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t bg-muted/10 space-y-2">
                    {deptDesignations.map((desig) => (
                      <div key={desig.id} className="p-2.5 border rounded-lg bg-card flex items-center justify-between text-xs">
                        <span className="font-semibold">{desig.name} ({desig.code})</span>
                        <span className="text-muted-foreground">{desig.employeeCount || 0} employees</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
