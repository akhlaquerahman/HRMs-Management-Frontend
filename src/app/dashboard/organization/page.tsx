"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import {
  Building2,
  Briefcase,
  Users,
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Network,
  UserPlus,
  MoreVertical,
  Eye,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AddDepartmentModal } from "@/components/organization/AddDepartmentModal";
import { AddDesignationModal } from "@/components/organization/AddDesignationModal";
import { AssignEmployeeOrgModal } from "@/components/organization/AssignEmployeeOrgModal";
import { DepartmentDetailsModal } from "@/components/organization/DepartmentDetailsModal";
import { OrganizationDirectoryModal } from "@/components/organization/OrganizationDirectoryModal";
import { OrgChartTree } from "@/components/organization/OrgChartTree";
import { DeleteConfirmModal } from "@/components/organization/DeleteConfirmModal";

export default function OrganizationPage() {
  // Summary Metrics
  const [summary, setSummary] = useState({
    departments: 0,
    designations: 0,
    employees: 0,
    managers: 0,
  });

  // Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "department" | "designation";
    item: { id: string; name: string; employeeCount?: number; designationCount?: number } | null;
  }>({
    isOpen: false,
    type: "department",
    item: null,
  });

  // Data lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [allDesignations, setAllDesignations] = useState<any[]>([]);
  const [allEmployeesList, setAllEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");

  // Alert message notification
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<any | null>(null);

  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
  const [desigToEdit, setDesigToEdit] = useState<any | null>(null);
  const [desigDefaultDeptId, setDesigDefaultDeptId] = useState<string | undefined>();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [employeeToAssign, setEmployeeToAssign] = useState<any | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDeptDetails, setSelectedDeptDetails] = useState<any | null>(null);

  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [directoryDeptId, setDirectoryDeptId] = useState<string | null>(null);
  const [directoryDesigId, setDirectoryDesigId] = useState<string | null>(null);

  const handleOpenDirectoryModal = (deptId?: string | null, desigId?: string | null) => {
    setDirectoryDeptId(deptId || null);
    setDirectoryDesigId(desigId || null);
    setIsDirectoryModalOpen(true);
  };

  // Fetch light overview API (No heavy employee arrays)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, desigRes, empListRes] = await Promise.all([
        api.get("/departments/overview"),
        api.get("/designations"),
        api.get("/employees?all=true&limit=5000"), // Complete list for manager dropdowns including HR Admins
      ]);

      if (overviewRes.data?.data) {
        const overview = overviewRes.data.data;
        setSummary(overview.summary || { departments: 0, designations: 0, employees: 0, managers: 0 });
        setDepartments(overview.departments || []);
      }

      if (desigRes.data?.data) {
        setAllDesignations(desigRes.data.data);
      }

      if (empListRes.data?.data) {
        setAllEmployeesList(empListRes.data.data);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to load organization data." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers for Department CRUD
  const handleOpenCreateDept = () => {
    setDeptToEdit(null);
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: any) => {
    setDeptToEdit(dept);
    setIsDeptModalOpen(true);
  };

  const handleToggleDeptStatus = async (dept: any) => {
    try {
      await api.put(`/departments/${dept.id}`, { status: !dept.status });
      setMessage({
        type: "success",
        text: `Department "${dept.name}" ${!dept.status ? "activated" : "deactivated"} successfully.`,
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update department status." });
    }
  };

  const handleDeleteDept = (deptOrId: any, nameParam?: string) => {
    const dept =
      typeof deptOrId === "object"
        ? deptOrId
        : departments.find((d) => d.id === deptOrId) || { id: deptOrId, name: nameParam || "Department" };

    setDeleteModalState({
      isOpen: true,
      type: "department",
      item: {
        id: dept.id,
        name: dept.name,
        employeeCount: dept.employeeCount || 0,
        designationCount: dept.designationCount || (dept.designations?.length || 0),
      },
    });
  };

  // Handlers for Designation CRUD
  const handleOpenCreateDesig = (deptId?: string) => {
    setDesigToEdit(null);
    setDesigDefaultDeptId(deptId);
    setIsDesigModalOpen(true);
  };

  const handleOpenEditDesig = (desig: any) => {
    setDesigToEdit(desig);
    setIsDesigModalOpen(true);
  };

  const handleDeleteDesig = (desigOrId: any, nameParam?: string) => {
    const desig =
      typeof desigOrId === "object"
        ? desigOrId
        : allDesignations.find((d) => d.id === desigOrId) || { id: desigOrId, name: nameParam || "Designation" };

    setDeleteModalState({
      isOpen: true,
      type: "designation",
      item: {
        id: desig.id,
        name: desig.name,
        employeeCount: desig._count?.employees ?? desig.employeeCount ?? 0,
      },
    });
  };

  const handleConfirmDeactivate = async (id: string) => {
    try {
      const endpoint =
        deleteModalState.type === "department"
          ? `/departments/${id}?action=deactivate`
          : `/designations/${id}?action=deactivate`;
      const res = await api.delete(endpoint);
      setMessage({
        type: "success",
        text: res.data?.message || `${deleteModalState.type} deactivated successfully.`,
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to deactivate item." });
    }
  };

  const handleConfirmForceDelete = async (id: string) => {
    try {
      const endpoint =
        deleteModalState.type === "department"
          ? `/departments/${id}?force=true`
          : `/designations/${id}?force=true`;
      const res = await api.delete(endpoint);
      setMessage({
        type: "success",
        text: res.data?.message || `${deleteModalState.type} deleted successfully.`,
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to delete item." });
    }
  };

  // Handlers for Employee Assignment & Details Modal
  const handleOpenAssignModal = (emp?: any) => {
    setEmployeeToAssign(emp || null);
    setIsAssignModalOpen(true);
  };

  const handleViewDeptDetails = (dept: any) => {
    setSelectedDeptDetails(dept);
    setIsDetailsModalOpen(true);
  };

  // Search filtering logic across Departments and Designations
  const searchLower = searchTerm.trim().toLowerCase();

  const filteredDepartments = departments.filter((dept) => {
    if (!searchLower) return true;
    const nameMatch = dept.name?.toLowerCase().includes(searchLower);
    const codeMatch = dept.code?.toLowerCase().includes(searchLower);
    const managerMatch = dept.manager?.name?.toLowerCase().includes(searchLower);
    const desigMatch = dept.designations?.some(
      (des: any) => des.name?.toLowerCase().includes(searchLower) || des.code?.toLowerCase().includes(searchLower)
    );
    return nameMatch || codeMatch || managerMatch || desigMatch;
  });

  const filteredDesignationsTable = allDesignations.filter((des) => {
    const matchesDept = selectedDeptFilter === "ALL" || des.departmentId === selectedDeptFilter;
    const matchesSearch =
      !searchLower ||
      des.name?.toLowerCase().includes(searchLower) ||
      des.code?.toLowerCase().includes(searchLower) ||
      des.department?.name?.toLowerCase().includes(searchLower);
    return matchesDept && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Organization Structure
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Centralized hierarchy management for departments, designations, and department managers.
          </p>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">

          <Button variant="outline" onClick={() => handleOpenAssignModal()} size="sm" className="h-9">
            <UserPlus className="h-4 w-4 mr-2" />
            Assign
          </Button>

          <Button variant="outline" onClick={() => handleOpenCreateDesig()} size="sm" className="h-9">
            <Briefcase className="h-4 w-4 mr-2" />
            Add Designation
          </Button>

          <Button onClick={handleOpenCreateDept} size="sm" className="h-9 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Alert banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              : "bg-destructive/15 text-destructive border border-destructive/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Departments
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.departments}</div>
            <p className="text-xs text-muted-foreground mt-1">Active organizational units</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Designations
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.designations}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assigned Employees
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.employees}</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned with company role</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department Managers
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.managers}</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned department heads</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Segmented Navigation & Search */}
      <Tabs defaultValue="hierarchy" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-muted/60 p-1 rounded-xl w-full md:w-auto">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2 rounded-lg text-xs font-semibold">
              <Network className="h-4 w-4" />
              Organization Hierarchy
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2 rounded-lg text-xs font-semibold">
              <Building2 className="h-4 w-4" />
              Departments ({departments.length})
            </TabsTrigger>
            <TabsTrigger value="designations" className="flex items-center gap-2 rounded-lg text-xs font-semibold">
              <Briefcase className="h-4 w-4" />
              Designations ({allDesignations.length})
            </TabsTrigger>
          </TabsList>

          {/* Organization Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search department, designation, or manager..."
              className="pl-9 h-9 text-xs rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TAB 1: Organization Hierarchy View */}
        <TabsContent value="hierarchy" className="mt-0">
          {loading ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading organization structure...</span>
            </div>
          ) : (
            <OrgChartTree
              departments={filteredDepartments}
              totalEmployees={summary.employees}
              onViewDetails={handleViewDeptDetails}
              onEditDepartment={handleOpenEditDept}
              onDeleteDepartment={handleDeleteDept}
              onAssignManager={(dept) => handleOpenEditDept(dept)}
              onAddDesignation={handleOpenCreateDesig}
              onEditDesignation={handleOpenEditDesig}
              onDeleteDesignation={handleDeleteDesig}
              onToggleDeptStatus={handleToggleDeptStatus}
              onOpenDirectory={handleOpenDirectoryModal}
            />
          )}
        </TabsContent>

        {/* TAB 2: Departments Master Table */}
        <TabsContent value="departments" className="mt-0">
          <Card className="border shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Department</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Designations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredDepartments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No departments match search query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartments.map((dept) => (
                      <TableRow key={dept.id} className="hover:bg-muted/10">
                        <TableCell className="font-semibold">
                          <div className="flex flex-col">
                            <span className="text-sm">{dept.name}</span>
                            {dept.description && (
                              <span className="text-xs text-muted-foreground font-normal line-clamp-1">
                                {dept.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {dept.code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {dept.manager ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                {dept.manager.firstName?.charAt(0) || "M"}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold">
                                  {dept.manager.name || `${dept.manager.firstName} ${dept.manager.lastName}`}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{dept.manager.employeeId}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No manager</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-medium">
                            {dept.employeeCount || 0} employees
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-medium">
                            {dept.designationCount || 0} titles
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {dept.status ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleViewDeptDetails(dept)} className="gap-2 text-xs">
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEditDept(dept)} className="gap-2 text-xs">
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                Edit Department
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenCreateDesig(dept.id)} className="gap-2 text-xs">
                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                Add Designation
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteDept(dept)}
                                className="gap-2 text-xs text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Department
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Designations Master Table */}
        <TabsContent value="designations" className="mt-0">
          <Card className="border shadow-xs">
            <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter Dept:</span>
                <select
                  className="h-8 px-2.5 py-1 border rounded-md text-xs bg-background"
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-muted-foreground">
                Showing {filteredDesignationsTable.length} of {allDesignations.length} designations
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Designation Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Seniority Level</TableHead>
                    <TableHead>Assigned Employees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredDesignationsTable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No designations match search query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDesignationsTable.map((desig) => (
                      <TableRow key={desig.id} className="hover:bg-muted/10">
                        <TableCell className="font-semibold text-sm">{desig.name}</TableCell>
                        <TableCell className="text-xs font-medium">{desig.department?.name || "Unassigned"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {desig.code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            Grade L{desig.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-medium">
                            {desig._count?.employees ?? desig.employeeCount ?? 0} employees
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {desig.status ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleOpenEditDesig(desig)} className="gap-2 text-xs">
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                Edit Designation
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteDesig(desig)}
                                className="gap-2 text-xs text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Designation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddDepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onSuccess={() => {
          setMessage({ type: "success", text: "Department saved successfully." });
          fetchData();
        }}
        departmentToEdit={deptToEdit}
        employees={allEmployeesList}
      />

      <AddDesignationModal
        isOpen={isDesigModalOpen}
        onClose={() => setIsDesigModalOpen(false)}
        onSuccess={() => {
          setMessage({ type: "success", text: "Designation saved successfully." });
          fetchData();
        }}
        designationToEdit={desigToEdit}
        departments={departments}
        defaultDepartmentId={desigDefaultDeptId}
      />

      <AssignEmployeeOrgModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          setMessage({ type: "success", text: "Employee organization structure updated." });
          fetchData();
        }}
        employees={allEmployeesList}
        departments={departments}
        designations={allDesignations}
        preselectedEmployee={employeeToAssign}
      />

      <DepartmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        department={selectedDeptDetails}
        onEditDepartment={handleOpenEditDept}
        onAssignManager={(dept) => handleOpenEditDept(dept)}
        onAddDesignation={handleOpenCreateDesig}
        onOpenDirectory={handleOpenDirectoryModal}
      />

      <OrganizationDirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        initialDepartmentId={directoryDeptId}
        initialDesignationId={directoryDesigId}
        departments={departments}
        designations={allDesignations}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        type={deleteModalState.type}
        item={deleteModalState.item}
        onConfirmDeactivate={handleConfirmDeactivate}
        onConfirmForceDelete={handleConfirmForceDelete}
      />
    </div>
  );
}
