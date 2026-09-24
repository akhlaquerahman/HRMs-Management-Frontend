"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Briefcase,
  Users,
  Search,
  Loader2,
  User,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Network,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";

interface Department {
  id: string;
  name: string;
  code: string | null;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    name?: string;
  } | null;
}

interface Designation {
  id: string;
  name: string;
  code: string | null;
  departmentId: string;
  level?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  status: string;
  departmentId?: string | null;
  designationId?: string | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string; employeeId: string } | null;
}

interface OrganizationDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDepartmentId?: string | null;
  initialDesignationId?: string | null;
  departments: Department[];
  designations: Designation[];
  companyName?: string;
}

export function OrganizationDirectoryModal({
  isOpen,
  onClose,
  initialDepartmentId,
  initialDesignationId,
  departments = [],
  designations = [],
  companyName,
}: OrganizationDirectoryModalProps) {
  const { user } = useAuthStore();
  const activeCompanyName = user?.companyName || companyName || "Mobiloitte";

  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"chart" | "list">("chart");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedDeptId(initialDepartmentId || "ALL");
      setSearch("");
      setZoomLevel(1);
    }
  }, [isOpen, initialDepartmentId]);

  const fetchDirectoryEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employees", {
        params: {
          department: selectedDeptId !== "ALL" ? selectedDeptId : undefined,
          limit: 1000,
        },
      });
      if (res.data?.data) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load directory employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDirectoryEmployees();
    }
  }, [isOpen, selectedDeptId]);

  // Group directory data for visual tree rendering
  const treeData = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    const targetDepts = selectedDeptId === "ALL"
      ? departments
      : departments.filter((d) => d.id === selectedDeptId);

    return targetDepts.map((dept) => {
      const deptDesignations = designations.filter((des) => des.departmentId === dept.id);
      const deptEmployees = employees.filter((emp) => emp.departmentId === dept.id);

      // Resolve department manager if not explicitly set
      const deptManager = dept.manager || (function() {
        const empWithMgr = deptEmployees.find((e: any) => e.manager);
        if (empWithMgr?.manager) {
          return {
            id: empWithMgr.manager.id,
            firstName: empWithMgr.manager.firstName,
            lastName: empWithMgr.manager.lastName,
            name: `${empWithMgr.manager.firstName} ${empWithMgr.manager.lastName}`,
            employeeId: empWithMgr.manager.employeeId || 'MGR'
          };
        }
        return null;
      })();

      const designationBranches = deptDesignations.map((desig) => {
        const desigEmps = deptEmployees.filter((emp) => emp.designationId === desig.id);
        const filteredEmps = desigEmps.filter((emp) => {
          if (!searchLower) return true;
          const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
          return (
            fullName.includes(searchLower) ||
            emp.employeeId.toLowerCase().includes(searchLower) ||
            emp.email.toLowerCase().includes(searchLower)
          );
        });
        return {
          designation: desig,
          employees: filteredEmps,
        };
      }).filter(b => !searchLower || b.employees.length > 0 || b.designation.name.toLowerCase().includes(searchLower));

      const unassignedEmps = deptEmployees.filter((emp) => !emp.designationId).filter((emp) => {
        if (!searchLower) return true;
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          emp.employeeId.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower)
        );
      });

      const totalCount = designationBranches.reduce((sum, b) => sum + b.employees.length, 0) + unassignedEmps.length;

      return {
        department: {
          ...dept,
          resolvedManager: deptManager
        },
        designationBranches,
        unassignedEmps,
        totalCount,
      };
    }).filter(d => !searchLower || d.totalCount > 0 || d.department.name.toLowerCase().includes(searchLower));
  }, [departments, designations, employees, selectedDeptId, search]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !(prev[nodeId] ?? true) }));
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 0.6), 1.4));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-[98vw] h-[94vh] max-h-[94vh] p-0 flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-4 px-6 border-b bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{activeCompanyName} - Organizational Chart Tree</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visual tree view of company departments, designations, and employee branches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                Org Tree Chart
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

            <Button
              variant="outline"
              size="sm"
              onClick={fetchDirectoryEmployees}
              disabled={loading}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter & Control Bar */}
        <div className="p-3 px-6 border-b bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Department Dropdown */}
            <select
              className="h-9 px-3 py-1 border rounded-md text-xs bg-background font-medium focus:ring-2 focus:ring-primary min-w-[200px]"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.code ? `(${dept.code})` : ""}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search node or employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          {/* Zoom Controls for Tree View */}
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
        </div>

        {/* Modal Body Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950/40 custom-scrollbar">
          {loading ? (
            <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Constructing organizational tree chart...</span>
            </div>
          ) : treeData.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground border rounded-xl bg-card max-w-md mx-auto my-12 space-y-3">
              <Network className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium">No matching department or designation nodes found.</p>
            </div>
          ) : viewMode === "chart" ? (
            /* VISUAL TREE CHART VIEW WITH CONNECTOR LINES */
            <div
              className="min-w-max p-8 flex flex-col items-center transition-transform origin-top duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* LEVEL 0: ROOT COMPANY NODE */}
              <div className="flex flex-col items-center">
                <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex items-center gap-3 border border-blue-400/30">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-tight">{activeCompanyName}</h3>
                    <p className="text-[11px] text-blue-100 font-medium">
                      {treeData.length} Departments • {employees.length} Total Employees
                    </p>
                  </div>
                </div>

                {/* Vertical Stem Line from Company Root to Branches */}
                <div className="w-0.5 h-8 bg-blue-500/40"></div>
              </div>

              {/* LEVEL 1: DEPARTMENTS BRANCHES */}
              <div className="flex items-start justify-center gap-8 relative pt-2">
                {/* Horizontal Top Connecting Rail Line */}
                {treeData.length > 1 && (
                  <div className="absolute top-0 left-[150px] right-[150px] h-0.5 bg-blue-500/40"></div>
                )}

                {treeData.map(({ department, designationBranches, unassignedEmps, totalCount }, dIdx) => {
                  const deptNodeId = `dept-${department.id}`;
                  const isDeptExpanded = expandedNodes[deptNodeId] ?? true;
                  const activeManager = (department as any).resolvedManager || department.manager;
                  const managerName = activeManager
                    ? activeManager.name || `${activeManager.firstName} ${activeManager.lastName}`
                    : null;

                  return (
                    <div key={department.id} className="flex flex-col items-center relative min-w-[280px] max-w-[340px]">
                      {/* Drop Vertical Line from Rail */}
                      <div className="w-0.5 h-6 bg-blue-500/40"></div>

                      {/* DEPARTMENT NODE CARD */}
                      <div className="w-full bg-card border-2 border-blue-500/30 rounded-xl p-4 shadow-md hover:border-blue-500 transition-all">
                        <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{department.name}</h4>
                              {department.code && (
                                <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                                  {department.code}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => toggleNode(deptNodeId)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground"
                            title={isDeptExpanded ? "Collapse Branch" : "Expand Branch"}
                          >
                            {isDeptExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </div>

                        {/* Manager Badge inside Department Node */}
                        <div className="mt-2.5 pt-1 text-xs">
                          {activeManager ? (
                            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-2 rounded-lg font-medium">
                              <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                                {activeManager.firstName?.charAt(0)}
                              </div>
                              <div className="flex flex-col truncate">
                                <span className="font-semibold text-xs leading-tight truncate">{managerName}</span>
                                <span className="text-[10px] text-emerald-600 font-mono">
                                  Dept Head ({activeManager.employeeId})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-1.5 border border-dashed rounded-md text-[11px] text-muted-foreground italic">
                              No Manager Assigned
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                          <span>{designationBranches.length} Designations</span>
                          <Badge variant="secondary" className="font-semibold text-[10px]">
                            {totalCount} Employees
                          </Badge>
                        </div>
                      </div>

                      {/* LEVEL 2: DESIGNATION CHILD BRANCHES */}
                      {isDeptExpanded && (
                        <div className="flex flex-col items-center w-full">
                          {/* Stem down from Department Card */}
                          <div className="w-0.5 h-6 bg-blue-500/40"></div>

                          {designationBranches.length === 0 && unassignedEmps.length === 0 ? (
                            <div className="text-[11px] text-muted-foreground italic p-2 border rounded-md bg-card">
                              No child designations created
                            </div>
                          ) : (
                            <div className="space-y-4 w-full flex flex-col items-center">
                              {designationBranches.map(({ designation, employees: desigEmps }) => {
                                const desigNodeId = `desig-${designation.id}`;
                                const isDesigExpanded = expandedNodes[desigNodeId] ?? true;

                                return (
                                  <div key={designation.id} className="flex flex-col items-center w-full">
                                    {/* DESIGNATION NODE CARD */}
                                    <div className="w-[92%] bg-card border rounded-lg p-3 shadow-xs hover:border-primary/40 transition-all border-l-4 border-l-primary">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <Briefcase className="h-4 w-4 text-primary shrink-0" />
                                          <div>
                                            <h5 className="font-bold text-xs text-foreground">{designation.name}</h5>
                                            {designation.code && (
                                              <span className="text-[10px] font-mono text-muted-foreground block">
                                                {designation.code}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          <Badge variant="outline" className="text-[10px] py-0 px-1">
                                            {desigEmps.length}
                                          </Badge>
                                          <button
                                            onClick={() => toggleNode(desigNodeId)}
                                            className="p-1 rounded hover:bg-muted text-muted-foreground"
                                          >
                                            {isDesigExpanded ? (
                                              <ChevronDown className="h-3.5 w-3.5" />
                                            ) : (
                                              <ChevronRight className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* LEVEL 3: EMPLOYEE LEAF NODES */}
                                    {isDesigExpanded && desigEmps.length > 0 && (
                                      <div className="flex flex-col items-center w-full pt-1">
                                        <div className="w-0.5 h-4 bg-muted-foreground/30"></div>
                                        <div className="grid grid-cols-1 gap-2 w-[85%]">
                                          {desigEmps.map((emp) => (
                                            <div
                                              key={emp.id}
                                              className="p-2 border rounded-md bg-background flex items-center justify-between text-xs shadow-2xs hover:border-primary/40"
                                            >
                                              <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                                                  {emp.firstName?.charAt(0) || "E"}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                  <span className="font-semibold text-xs text-foreground truncate">
                                                    {emp.firstName} {emp.lastName}
                                                  </span>
                                                  <span className="text-[10px] font-mono text-muted-foreground">
                                                    {emp.employeeId}
                                                  </span>
                                                </div>
                                              </div>

                                              <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0">
                                                Active
                                              </Badge>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
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
          ) : (
            /* COMPACT LIST VIEW */
            <div className="space-y-6 max-w-4xl mx-auto">
              {treeData.map(({ department, designationBranches, unassignedEmps, totalCount }) => (
                <div key={department.id} className="border rounded-xl bg-card overflow-hidden shadow-xs">
                  <div className="p-4 bg-muted/40 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base">{department.name}</h4>
                        {department.code && <span className="text-xs font-mono text-muted-foreground">({department.code})</span>}
                      </div>
                    </div>
                    <Badge variant="secondary">{totalCount} Employees</Badge>
                  </div>

                  <div className="p-4 space-y-4">
                    {designationBranches.map(({ designation, employees: desigEmps }) => (
                      <div key={designation.id} className="pl-3 border-l-2 border-primary/30 space-y-2">
                        <div className="flex items-center justify-between bg-muted/20 px-3 py-1.5 rounded-md text-xs font-semibold">
                          <span>{designation.name}</span>
                          <span>{desigEmps.length} employees</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {desigEmps.map((emp) => (
                            <div key={emp.id} className="p-2 border rounded-md bg-background flex items-center justify-between text-xs">
                              <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{emp.employeeId}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
