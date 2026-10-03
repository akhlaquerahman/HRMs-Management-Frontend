"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/axios';
import { 
  Layers, 
  Clock, 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceTime: number;
  breakDuration: number;
  weeklyOff: string[];
  status: boolean;
  _count?: {
    employees: number;
  };
}

interface EmployeeRoster {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  shiftId?: string;
  status: string;
  department?: { id: string; name: string };
  designation?: { id: string; name: string };
  shift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    weeklyOff: string[];
  };
}

export function ShiftTemplatesTab() {
  const { t } = useTranslation();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [roster, setRoster] = useState<EmployeeRoster[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('ALL');

  // Modals state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Partial<Shift> | null>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [targetShiftId, setTargetShiftId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Shifts
  const fetchShifts = async () => {
    try {
      setLoadingShifts(true);
      const res = await api.get('/shifts');
      if (res.data?.success) {
        setShifts(res.data.data || []);
      }
    } catch (e) {
      console.error("Failed to load shifts", e);
    } finally {
      setLoadingShifts(false);
    }
  };

  // Fetch Roster
  const fetchRoster = async () => {
    try {
      setLoadingRoster(true);
      const res = await api.get('/shifts/roster');
      if (res.data?.success) {
        setRoster(res.data.data || []);
      }
    } catch (e) {
      console.error("Failed to load roster", e);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchRoster();
  }, []);

  // Filtered Roster
  const filteredRoster = roster.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.department?.id === selectedDept;
    
    let matchesShift = true;
    if (selectedShiftFilter === 'UNASSIGNED') {
      matchesShift = !emp.shiftId;
    } else if (selectedShiftFilter !== 'ALL') {
      matchesShift = emp.shiftId === selectedShiftFilter;
    }

    return matchesSearch && matchesDept && matchesShift;
  });

  // Department List
  const departmentsMap = new Map<string, string>();
  roster.forEach(e => {
    if (e.department) {
      departmentsMap.set(e.department.id, e.department.name);
    }
  });
  const departments = Array.from(departmentsMap.entries()).map(([id, name]) => ({ id, name }));

  // Handle Save Shift (Create / Edit)
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift?.name || !editingShift?.startTime || !editingShift?.endTime) {
      alert("Please fill in Shift Name, Start Time and End Time.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: editingShift.name,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        graceTime: Number(editingShift.graceTime || 15),
        breakDuration: Number(editingShift.breakDuration || 60),
        weeklyOff: editingShift.weeklyOff || ["Saturday", "Sunday"],
        status: editingShift.status !== undefined ? editingShift.status : true,
      };

      if (editingShift.id) {
        await api.put(`/shifts/${editingShift.id}`, payload);
      } else {
        await api.post('/shifts', payload);
      }

      setIsShiftModalOpen(false);
      setEditingShift(null);
      await fetchShifts();
      await fetchRoster();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error saving shift");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Shift
  const handleDeleteShift = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift? Unassigned employees will revert to standard hours.")) return;
    try {
      await api.delete(`/shifts/${id}`);
      await fetchShifts();
      await fetchRoster();
    } catch (err: any) {
      alert("Failed to delete shift.");
    }
  };

  // Handle Bulk / Single Shift Assignment
  const handleAssignShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployeeIds.length === 0) return;

    try {
      setSubmitting(true);
      await api.post('/shifts/assign', {
        employeeIds: selectedEmployeeIds,
        shiftId: targetShiftId === 'UNASSIGN' ? null : targetShiftId
      });

      setIsAssignModalOpen(false);
      setSelectedEmployeeIds([]);
      setTargetShiftId('');
      await fetchShifts();
      await fetchRoster();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign shift.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(filteredRoster.map(e => e.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const toggleSelectEmployee = (id: string) => {
    if (selectedEmployeeIds.includes(id)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(i => i !== id));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, id]);
    }
  };

  const weekDaysList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleWeeklyOff = (day: string) => {
    const currentOffs = editingShift?.weeklyOff || [];
    if (currentOffs.includes(day)) {
      setEditingShift({
        ...editingShift,
        weeklyOff: currentOffs.filter(d => d !== day)
      });
    } else {
      setEditingShift({
        ...editingShift,
        weeklyOff: [...currentOffs, day]
      });
    }
  };

  const totalShifts = shifts.length;
  const totalAssigned = roster.filter(e => e.shiftId).length;
  const totalUnassigned = roster.length - totalAssigned;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-foreground">Shift Templates & Timing Profiles</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { fetchShifts(); fetchRoster(); }}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingShifts || loadingRoster ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            size="sm" 
            onClick={() => {
              setEditingShift({
                name: '',
                startTime: '09:00',
                endTime: '18:00',
                graceTime: 15,
                breakDuration: 60,
                weeklyOff: ['Saturday', 'Sunday'],
                status: true
              });
              setIsShiftModalOpen(true);
            }}
            className="h-9 gap-1.5 text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Create New Shift
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">{t("Total Active Shifts")}</span>
            <span className="text-xl font-extrabold text-foreground font-mono">{totalShifts}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">{t("Assigned Employees")}</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono">{totalAssigned}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">{t("Unassigned Roster")}</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono">{totalUnassigned}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">{t("Default General Hours")}</span>
            <span className="text-sm font-extrabold text-foreground font-mono">09:00 - 18:00</span>
          </div>
        </div>
      </div>

      {/* SHIFT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {shifts.map(shift => (
          <div 
            key={shift.id} 
            className="p-5 rounded-2xl border bg-card shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-sm text-foreground truncate">{shift.name}</h3>
                <Badge variant="outline" className={`text-[10px] font-bold ${shift.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-50 text-slate-600'}`}>
                  {shift.status ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-foreground font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Timing
                  </span>
                  <span className="font-bold font-mono text-foreground">{shift.startTime} - {shift.endTime}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Break & Grace</span>
                  <span className="font-semibold">{shift.breakDuration}m break | {shift.graceTime}m grace</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Week Offs</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {shift.weeklyOff?.length ? (
                      shift.weeklyOff.map(off => (
                        <span key={off} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {off.slice(0, 3)}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {shift._count?.employees || 0} Employees
              </span>

              <div className="flex items-center gap-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEditingShift(shift);
                    setIsShiftModalOpen(true);
                  }}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  onClick={() => handleDeleteShift(shift.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EMPLOYEE ASSIGNMENT TABLE */}
      <div className="rounded-2xl border bg-card shadow-xs flex flex-col overflow-hidden mt-2">
        <div className="p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Default Employee Shift Assignment</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Assign primary default shift profiles to employees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedEmployeeIds.length > 0 && (
              <Button 
                size="sm" 
                onClick={() => {
                  setTargetShiftId('');
                  setIsAssignModalOpen(true);
                }}
                className="h-9 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                Assign Shift to Selected ({selectedEmployeeIds.length})
              </Button>
            )}

            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search employee..." 
                className="pl-8 h-9 text-xs bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 px-3 rounded-lg border bg-background text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border bg-background text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="ALL">All Shifts</option>
              <option value="UNASSIGNED">Unassigned Only</option>
              {shifts.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 pl-5 w-10">
                  <input 
                    type="checkbox"
                    checked={filteredRoster.length > 0 && selectedEmployeeIds.length === filteredRoster.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Department & Title</th>
                <th className="p-3.5">Assigned Shift</th>
                <th className="p-3.5">Configured Week Offs</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loadingRoster ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading employee roster...
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredRoster.map(emp => {
                  const isSelected = selectedEmployeeIds.includes(emp.id);

                  return (
                    <tr key={emp.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                      <td className="p-3.5 pl-5">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectEmployee(emp.id)}
                          className="rounded border-slate-300 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20">
                            {emp.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">{emp.firstName} {emp.lastName}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{emp.employeeId} • {emp.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-foreground block">{emp.department?.name || 'General'}</span>
                        <span className="text-[11px] text-muted-foreground">{emp.designation?.name || 'Employee'}</span>
                      </td>

                      <td className="p-3.5">
                        {emp.shift ? (
                          <Badge className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 font-semibold px-2.5 py-1 gap-1">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span>{emp.shift.name} ({emp.shift.startTime} - {emp.shift.endTime})</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 font-medium">
                            Standard (09:00 - 18:00)
                          </Badge>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {emp.shift?.weeklyOff?.length ? (
                            emp.shift.weeklyOff.map(off => (
                              <span key={off} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                {off}
                              </span>
                            ))
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              Saturday, Sunday
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedEmployeeIds([emp.id]);
                            setTargetShiftId(emp.shiftId || '');
                            setIsAssignModalOpen(true);
                          }}
                          className="h-8 text-xs font-semibold px-2.5"
                        >
                          Change Shift
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT SHIFT MODAL */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingShift?.id ? "Edit Shift Profile" : "Create New Shift Profile"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure timing, grace period, break duration, and weekly off days for this shift.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveShift} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Shift Name *</label>
              <Input 
                placeholder="e.g. Morning Shift, Night Shift"
                value={editingShift?.name || ''}
                onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Start Time *</label>
                <Input 
                  type="time" 
                  value={editingShift?.startTime || '09:00'}
                  onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">End Time *</label>
                <Input 
                  type="time" 
                  value={editingShift?.endTime || '18:00'}
                  onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Break Duration (Mins)</label>
                <Input 
                  type="number"
                  min="0"
                  value={editingShift?.breakDuration || 60}
                  onChange={(e) => setEditingShift({ ...editingShift, breakDuration: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Grace Period (Mins)</label>
                <Input 
                  type="number"
                  min="0"
                  value={editingShift?.graceTime || 15}
                  onChange={(e) => setEditingShift({ ...editingShift, graceTime: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Configured Weekly Off Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {weekDaysList.map(day => {
                  const isChecked = editingShift?.weeklyOff?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeeklyOff(day)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        isChecked 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' 
                          : 'bg-muted/20 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {day.slice(0, 3)} {isChecked ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsShiftModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="font-bold">
                {submitting ? "Saving..." : "Save Shift Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ASSIGN SHIFT MODAL */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Assign Shift Roster
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign selected employee(s) to a working shift profile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignShiftSubmit} className="space-y-4 py-2">
            <div className="p-3 rounded-xl border bg-muted/20 text-xs">
              <span className="text-muted-foreground block font-semibold mb-1">Selected Employees ({selectedEmployeeIds.length}):</span>
              <div className="max-h-24 overflow-y-auto custom-scrollbar font-mono text-[11px] text-foreground space-y-0.5">
                {selectedEmployeeIds.map(id => {
                  const emp = roster.find(e => e.id === id);
                  return emp ? <div key={id}>• {emp.firstName} {emp.lastName} ({emp.employeeId})</div> : null;
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Target Shift *</label>
              <select
                value={targetShiftId}
                onChange={(e) => setTargetShiftId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium text-foreground focus:outline-none"
                required
              >
                <option value="">-- Select Shift Profile --</option>
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime}) [Off: {s.weeklyOff?.join(', ') || 'Sat, Sun'}]
                  </option>
                ))}
                <option value="UNASSIGN">Unassign / Reset to Standard Shift</option>
              </select>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="font-bold bg-primary text-primary-foreground">
                {submitting ? "Updating..." : "Confirm & Sync Roster"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
