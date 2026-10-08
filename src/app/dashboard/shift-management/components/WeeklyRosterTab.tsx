"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Save, 
  Send, 
  Download, 
  Upload, 
  Copy, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Layers, 
  Clock, 
  Filter, 
  Sparkles,
  FileSpreadsheet,
  FileCheck,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RosterCellEditorModal } from './RosterCellEditorModal';
import { RosterReviewModal } from './RosterReviewModal';
import { RosterImportModal } from './RosterImportModal';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Designation {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  weeklyOff: string[];
}

interface DaySchedule {
  date: string;
  dayName: string;
  type: string; // SHIFT, WEEK_OFF, LEAVE, HOLIDAY, WFH, HALF_DAY
  shiftId: string | null;
  shift?: Shift | null;
  leaveType?: string | null;
  holidayName?: string | null;
  notes?: string | null;
  isOverridden?: boolean;
  overrideReason?: string | null;
  hasApprovedLeave?: boolean;
  approvedLeaveType?: string | null;
  isHoliday?: boolean;
}

interface EmployeeGridRow {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  department?: { id: string; name: string };
  designation?: { id: string; name: string };
  days: DaySchedule[];
}

interface ConflictItem {
  employeeId: string;
  employeeName: string;
  date: string;
  type: string;
  message: string;
}

// Helper to format Date object to YYYY-MM-DD string without timezone offset
function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function WeeklyRosterTab() {
  // Departments & Designations
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedDesigId, setSelectedDesigId] = useState<string>('ALL');

  // Date Navigation (Default current week Sunday)
  const [currentWeekSunday, setCurrentWeekSunday] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const sun = new Date(d);
    sun.setDate(d.getDate() - day);
    sun.setHours(0, 0, 0, 0);
    return sun;
  });

  // Roster State
  const [rosterData, setRosterData] = useState<{
    id: string | null;
    status: string;
    version: number;
    publishedAt: string | null;
  }>({ id: null, status: 'DRAFT', version: 1, publishedAt: null });

  const [grid, setGrid] = useState<EmployeeGridRow[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    scheduled: 0,
    weekOff: 0,
    onLeave: 0,
    unassigned: 0,
    conflicts: 0
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Search & Shift filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');
  const [shiftSortOrder, setShiftSortOrder] = useState<string>('GROUP_BY_SHIFT');

  // Bulk Selection
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Modals state
  const [editingCell, setEditingCell] = useState<{
    row: EmployeeGridRow;
    day: DaySchedule;
  } | null>(null);
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    employeeId: string;
    date: string;
  } | null>(null);

  // Fetch Departments on Mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data?.success) {
          const depts = res.data.data || [];
          setDepartments(depts);
        }
      } catch (e) {
        console.warn('Departments load notice:', e);
      }
    };
    loadDepartments();
  }, []);

  // Fetch Designations dependent on Department Selection
  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const url = selectedDeptId && selectedDeptId !== 'ALL'
          ? `/designations?departmentId=${selectedDeptId}`
          : '/designations';
        const res = await api.get(url);
        if (res.data?.success) {
          let list = res.data.data || [];
          if (list.length === 0 && selectedDeptId !== 'ALL') {
            const fallbackRes = await api.get('/designations').catch(() => null);
            if (fallbackRes?.data?.success) {
              list = fallbackRes.data.data || [];
            }
          }
          setDesignations(list);
        }
      } catch (e) {
        console.warn('Designations load notice:', e);
      }
    };
    loadDesignations();
  }, [selectedDeptId]);

  // Format week range string: "Sep 27, 2026 – Oct 03, 2026"
  const getWeekStartStr = useCallback((sun: Date) => {
    return formatDateToYYYYMMDD(sun);
  }, []);

  const weekEndSaturday = new Date(currentWeekSunday);
  weekEndSaturday.setDate(currentWeekSunday.getDate() + 6);

  const formattedWeekRangeStr = `${currentWeekSunday.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} – ${weekEndSaturday.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;

  // Load Roster from Backend
  const loadRoster = async () => {
    if (!selectedDeptId) {
      alert('Please select a department to load roster.');
      return;
    }

    try {
      setLoading(true);
      const weekStartStr = getWeekStartStr(currentWeekSunday);
      const res = await api.get('/roster', {
        params: {
          departmentId: 'ALL',
          designationId: 'ALL',
          weekStart: weekStartStr
        }
      });

      if (res.data?.success) {
        const d = res.data.data;
        setRosterData(d.roster || { id: null, status: 'DRAFT', version: 1, publishedAt: null });
        setGrid(d.grid || []);
        setShifts(d.shifts || []);
        setConflicts(d.conflicts || []);
        setStats(d.stats || { totalEmployees: 0, scheduled: 0, weekOff: 0, onLeave: 0, unassigned: 0, conflicts: 0 });
        setHasUnsavedChanges(false);
        setSelectedEmployeeIds([]);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to load weekly roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [currentWeekSunday]);

  // Unsaved changes window listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Your roster has unsaved changes.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Week Navigation Handlers
  const handlePrevWeek = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard and switch week?')) return;
    const prev = new Date(currentWeekSunday);
    prev.setDate(currentWeekSunday.getDate() - 7);
    setCurrentWeekSunday(prev);
  };

  const handleNextWeek = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard and switch week?')) return;
    const next = new Date(currentWeekSunday);
    next.setDate(currentWeekSunday.getDate() + 7);
    setCurrentWeekSunday(next);
  };

  const handleTodayWeek = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard and return to today?')) return;
    const d = new Date();
    const day = d.getDay();
    const sun = new Date(d);
    sun.setDate(d.getDate() - day);
    sun.setHours(0, 0, 0, 0);
    setCurrentWeekSunday(sun);
  };

  // Cell Edit Save Handler
  const handleSaveCell = (updatedCellData: any) => {
    setGrid(prevGrid => {
      return prevGrid.map(row => {
        if (row.id === updatedCellData.employeeId) {
          const updatedDays = row.days.map(d => {
            if (d.date === updatedCellData.date) {
              const matchedShift = shifts.find(s => s.id === updatedCellData.shiftId) || null;
              return {
                ...d,
                type: updatedCellData.type,
                shiftId: updatedCellData.shiftId,
                shift: matchedShift,
                leaveType: updatedCellData.leaveType,
                notes: updatedCellData.notes,
                isOverridden: updatedCellData.isOverridden,
                overrideReason: updatedCellData.overrideReason
              };
            }
            return d;
          });
          return { ...row, days: updatedDays };
        }
        return row;
      });
    });

    setHasUnsavedChanges(true);
    recalculateStats();
  };

  // Recalculate KPI Stats dynamically
  const recalculateStats = () => {
    let scheduled = 0;
    let weekOff = 0;
    let leave = 0;
    let unassigned = 0;

    grid.forEach(row => {
      row.days.forEach(day => {
        if (day.type === 'SHIFT' && day.shiftId) scheduled++;
        else if (day.type === 'WEEK_OFF') weekOff++;
        else if (day.type === 'LEAVE') leave++;
        else if (day.type === 'SHIFT' && !day.shiftId) unassigned++;
      });
    });

    setStats(prev => ({
      ...prev,
      totalEmployees: grid.length,
      scheduled,
      weekOff,
      onLeave: leave,
      unassigned
    }));
  };

  // Quick Action Handler (Context Menu / Quick Action)
  const applyQuickAction = (employeeId: string, date: string, type: string, shiftId?: string) => {
    const matchedShift = shiftId ? shifts.find(s => s.id === shiftId) || null : null;
    
    setGrid(prevGrid => {
      return prevGrid.map(row => {
        if (row.id === employeeId) {
          const updatedDays = row.days.map(d => {
            if (d.date === date) {
              return {
                ...d,
                type,
                shiftId: shiftId || null,
                shift: matchedShift,
                notes: type === 'WEEK_OFF' ? 'Quick OFF' : d.notes
              };
            }
            return d;
          });
          return { ...row, days: updatedDays };
        }
        return row;
      });
    });

    setContextMenu(null);
    setHasUnsavedChanges(true);
    recalculateStats();
  };

  // Bulk Actions for Selected Employees
  const applyBulkActionToEmployees = (type: string, shiftId?: string) => {
    if (selectedEmployeeIds.length === 0) return;
    const matchedShift = shiftId ? shifts.find(s => s.id === shiftId) || null : null;

    setGrid(prevGrid => {
      return prevGrid.map(row => {
        if (selectedEmployeeIds.includes(row.id)) {
          const updatedDays = row.days.map(d => {
            return {
              ...d,
              type,
              shiftId: shiftId || null,
              shift: matchedShift
            };
          });
          return { ...row, days: updatedDays };
        }
        return row;
      });
    });

    setHasUnsavedChanges(true);
    recalculateStats();
  };

  // Bulk Action for Column Day Header (Assign Shift or Week Off to all employees for a day)
  const applyBulkActionToDay = (dateStr: string, type: string, shiftId?: string) => {
    const matchedShift = shiftId ? shifts.find(s => s.id === shiftId) || null : null;

    setGrid(prevGrid => {
      return prevGrid.map(row => {
        const updatedDays = row.days.map(d => {
          if (d.date === dateStr) {
            return {
              ...d,
              type,
              shiftId: shiftId || null,
              shift: matchedShift
            };
          }
          return d;
        });
        return { ...row, days: updatedDays };
      });
    });

    setHasUnsavedChanges(true);
    recalculateStats();
  };

  // Copy Previous Week
  const handleCopyPreviousWeek = async () => {
    if (!selectedDeptId) return;

    const prevSun = new Date(currentWeekSunday);
    prevSun.setDate(currentWeekSunday.getDate() - 7);
    const sourceWeekStart = getWeekStartStr(prevSun);
    const targetWeekStart = getWeekStartStr(currentWeekSunday);

    try {
      setLoading(true);
      const res = await api.post('/roster/copy-week', {
        departmentId: selectedDeptId,
        designationId: selectedDesigId,
        sourceWeekStart,
        targetWeekStart
      });

      if (res.data?.success) {
        alert(res.data.message || 'Copied previous week schedule as DRAFT!');
        await loadRoster();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to copy previous week.');
    } finally {
      setLoading(false);
    }
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!selectedDeptId) return;

    try {
      setSaving(true);
      setSaveStatus('Saving draft...');

      // Flatten grid entries
      const entries: any[] = [];
      grid.forEach(row => {
        row.days.forEach(day => {
          entries.push({
            employeeId: row.id,
            date: day.date,
            type: day.type,
            shiftId: day.shiftId,
            leaveType: day.leaveType,
            notes: day.notes,
            isOverridden: day.isOverridden,
            overrideReason: day.overrideReason
          });
        });
      });

      const res = await api.post('/roster/save-draft', {
        departmentId: selectedDeptId,
        designationId: selectedDesigId,
        weekStart: getWeekStartStr(currentWeekSunday),
        entries
      });

      if (res.data?.success) {
        setSaveStatus('Saved just now');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save draft.');
      setSaveStatus('Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Publish Handler
  const handleConfirmPublish = async () => {
    try {
      setPublishing(true);
      const res = await api.post('/roster/publish', {
        departmentId: selectedDeptId,
        designationId: selectedDesigId,
        weekStart: getWeekStartStr(currentWeekSunday)
      });

      if (res.data?.success) {
        alert(res.data.message || 'Roster published successfully!');
        setIsReviewModalOpen(false);
        await loadRoster();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to publish roster.');
    } finally {
      setPublishing(false);
    }
  };

  // Export XLSX Handler
  const handleExportXlsx = async () => {
    try {
      const response = await api.post('/roster/export-xlsx', {
        departmentId: selectedDeptId,
        designationId: selectedDesigId,
        shiftFilter: selectedShiftFilter,
        searchTerm: searchTerm,
        weekStart: getWeekStartStr(currentWeekSunday)
      }, { responseType: 'blob' });

      const deptObj = departments.find(d => d.id === selectedDeptId);
      const safeDept = (deptObj?.name || 'All_Departments').replace(/[^a-zA-Z0-9_-]/g, '_');
      const desigObj = designations.find(d => d.id === selectedDesigId);
      const safeDesig = (desigObj?.name || 'All_Designations').replace(/[^a-zA-Z0-9_-]/g, '_');

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HRMS_Roster_${safeDept}_${safeDesig}_${getWeekStartStr(currentWeekSunday)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to export XLSX roster');
    }
  };

  // Helper to get employee primary shift
  const getPrimaryShift = (emp: EmployeeGridRow): Shift | null => {
    for (const d of emp.days) {
      if (d.type === 'SHIFT' && d.shift) {
        return d.shift;
      }
    }
    return null;
  };

  // Helper to get employee configured week off days string
  const getEmployeeWeekOffDays = (emp: EmployeeGridRow): string => {
    const weekOffDays = emp.days
      .filter(d => d.type === 'WEEK_OFF')
      .map(d => {
        const parts = d.date.split('-');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return dt.toLocaleDateString('en-US', { weekday: 'short' });
        }
        return '';
      })
      .filter(Boolean);

    if (weekOffDays.length > 0) {
      return Array.from(new Set(weekOffDays)).join(', ');
    }

    if (emp.shift?.weeklyOff && Array.isArray(emp.shift.weeklyOff) && emp.shift.weeklyOff.length > 0) {
      return emp.shift.weeklyOff.map((w: string) => w.substring(0, 3)).join(', ');
    }

    return 'Sun';
  };

  // Filter & Sort Grid by Search, Department, Designation, Shift Filter, and Sort Order
  const filteredGrid = React.useMemo(() => {
    return grid
      .filter(emp => {
        // 1. Search filter
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                              emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        // 2. Department filter
        if (selectedDeptId !== 'ALL') {
          if (emp.department?.id !== selectedDeptId) return false;
        }

        // 3. Designation filter
        if (selectedDesigId !== 'ALL') {
          if (emp.designation?.id !== selectedDesigId) return false;
        }

        // 4. Shift filter
        if (selectedShiftFilter !== 'ALL') {
          if (selectedShiftFilter === 'UNASSIGNED') {
            const hasUnassigned = emp.days.some(d => d.type === 'SHIFT' && !d.shiftId);
            if (!hasUnassigned) return false;
          } else {
            const matchesShift = emp.days.some(d => d.shiftId === selectedShiftFilter || d.shift?.id === selectedShiftFilter);
            if (!matchesShift) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const shiftA = getPrimaryShift(a);
        const shiftB = getPrimaryShift(b);

        if (shiftSortOrder === 'NAME_ASC') {
          return a.firstName.localeCompare(b.firstName);
        }
        if (shiftSortOrder === 'NAME_DESC') {
          return b.firstName.localeCompare(a.firstName);
        }
        if (shiftSortOrder === 'SHIFT_NAME_ASC' || shiftSortOrder === 'GROUP_BY_SHIFT') {
          const nameA = shiftA?.name || 'ZZZ_UNASSIGNED';
          const nameB = shiftB?.name || 'ZZZ_UNASSIGNED';
          if (nameA !== nameB) return nameA.localeCompare(nameB);
          return a.firstName.localeCompare(b.firstName);
        }
        if (shiftSortOrder === 'SHIFT_TIME_ASC') {
          const timeA = shiftA?.startTime || '99:99';
          const timeB = shiftB?.startTime || '99:99';
          if (timeA !== timeB) return timeA.localeCompare(timeB);
          return a.firstName.localeCompare(b.firstName);
        }
        if (shiftSortOrder === 'SHIFT_TIME_DESC') {
          const timeA = shiftA?.startTime || '00:00';
          const timeB = shiftB?.startTime || '00:00';
          if (timeA !== timeB) return timeB.localeCompare(timeA);
          return a.firstName.localeCompare(b.firstName);
        }
        return 0;
      });
  }, [grid, searchTerm, selectedDeptId, selectedDesigId, selectedShiftFilter, shiftSortOrder]);

  // Group grid employees by shift when GROUP_BY_SHIFT is selected
  const groupedGrid = React.useMemo(() => {
    if (shiftSortOrder !== 'GROUP_BY_SHIFT') return null;

    const groupMap: { [key: string]: { shift: Shift | null; employees: EmployeeGridRow[] } } = {};

    filteredGrid.forEach(emp => {
      const primaryShift = getPrimaryShift(emp);
      const key = primaryShift ? primaryShift.id : 'UNASSIGNED';

      if (!groupMap[key]) {
        groupMap[key] = {
          shift: primaryShift,
          employees: []
        };
      }
      groupMap[key].employees.push(emp);
    });

    return Object.values(groupMap);
  }, [filteredGrid, shiftSortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(filteredGrid.map(e => e.id));
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

  // Helper to calculate daily shift & leave breakdown for a specific date string
  const getDailyMetricsForDate = useCallback((dateStr: string) => {
    let scheduled = 0;
    let weekOff = 0;
    let leave = 0;
    let holiday = 0;
    let wfh = 0;
    let halfDay = 0;

    grid.forEach(row => {
      const day = row.days.find(d => d.date === dateStr);
      if (!day) return;

      if (day.type === 'SHIFT' && day.shiftId) scheduled++;
      else if (day.type === 'WEEK_OFF' || day.type === 'OFF') weekOff++;
      else if (day.type === 'LEAVE') leave++;
      else if (day.type === 'HOLIDAY') holiday++;
      else if (day.type === 'WFH') wfh++;
      else if (day.type === 'HALF_DAY') halfDay++;
      else if (day.type === 'SHIFT' && !day.shiftId) scheduled++;
    });

    const totalEmployees = grid.length;
    const workingCount = scheduled + wfh + halfDay;

    return {
      scheduled,
      weekOff,
      leave,
      holiday,
      wfh,
      halfDay,
      workingCount,
      totalEmployees
    };
  }, [grid]);

  // Helper for today highlight
  const todayStr = formatDateToYYYYMMDD(new Date());

  const selectedDepartmentName = departments.find(d => d.id === selectedDeptId)?.name || 'Marketing';
  const selectedDesignationName = designations.find(d => d.id === selectedDesigId)?.name || 'All Designations';

  return (
    <div className="flex flex-col gap-5 relative">
      
      {/* 1. ENTERPRISE FILTER & ACTION TOOLBAR (SINGLE HORIZONTAL ROW) */}
      <div className="p-3 rounded-xl border bg-card shadow-2xs overflow-x-auto custom-scrollbar flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          {/* Department Select */}
          <select
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              setSelectedDesigId('ALL');
            }}
            className="h-8 px-2.5 rounded-lg border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0 min-w-[140px]"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Designation Select */}
          <select
            value={selectedDesigId}
            onChange={(e) => setSelectedDesigId(e.target.value)}
            className="h-8 px-2.5 rounded-lg border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0 min-w-[145px]"
          >
            <option value="ALL">All Designations</option>
            {designations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Shift Filter Select */}
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0 min-w-[130px]"
          >
            <option value="ALL">All Shifts</option>
            {shifts.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
            ))}
            <option value="UNASSIGNED">Unassigned / No Shift</option>
          </select>

          {/* Shift Arranging & Sort Select */}
          <select
            value={shiftSortOrder}
            onChange={(e) => setShiftSortOrder(e.target.value)}
            className="h-8 px-2.5 rounded-lg border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0 min-w-[165px]"
          >
            <option value="GROUP_BY_SHIFT">Arrange: Group by Shift 📂</option>
            <option value="SHIFT_TIME_ASC">Sort: Shift Time (Earliest First 🟢)</option>
            <option value="SHIFT_TIME_DESC">Sort: Shift Time (Latest First 🔴)</option>
            <option value="SHIFT_NAME_ASC">Sort: Shift Name (A-Z)</option>
            <option value="NAME_ASC">Sort: Name (A-Z)</option>
            <option value="NAME_DESC">Sort: Name (Z-A)</option>
          </select>

          {/* Week Selector Controls */}
          <div className="flex items-center bg-muted/30 border rounded-lg p-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handlePrevWeek} title="Previous Week">
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <span className="text-xs font-bold font-mono px-2 text-foreground select-none whitespace-nowrap">
              {formattedWeekRangeStr}
            </span>

            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleNextWeek} title="Next Week">
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            <Button size="sm" variant="ghost" className="h-7 text-[11px] font-bold px-2 text-primary hover:bg-primary/10" onClick={handleTodayWeek}>
              Today
            </Button>
          </div>

          {/* Roster Status Badge */}
          <Badge className={`px-2 py-0.5 font-semibold text-xs border shrink-0 whitespace-nowrap ${
            rosterData.status === 'PUBLISHED'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
              : rosterData.status === 'LOCKED'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {rosterData.status} (v{rosterData.version})
          </Badge>
        </div>

        {/* Action Buttons Right (Single Row) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsImportModalOpen(true)}
            className="h-8 text-xs font-medium gap-1 px-2.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportXlsx}
            className="h-8 text-xs font-medium gap-1 px-2.5 text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export</span>
          </Button>

          <Button 
            size="sm" 
            onClick={handleSaveDraft}
            disabled={saving || rosterData.status === 'LOCKED'}
            variant="outline"
            className="h-8 text-xs font-semibold gap-1 px-2.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </Button>

          <Button 
            size="sm" 
            onClick={() => setIsReviewModalOpen(true)}
            disabled={publishing || grid.length === 0 || rosterData.status === 'LOCKED'}
            className="h-8 text-xs font-semibold gap-1 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Review & Publish</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl border bg-card shadow-2xs">
          <span className="text-[11px] text-muted-foreground font-medium block">Total Employees</span>
          <span className="text-lg font-bold text-foreground font-mono mt-0.5 block">{stats.totalEmployees}</span>
        </div>

        <div className="p-3 rounded-xl border bg-card shadow-2xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">Scheduled Shifts</span>
          <span className="text-lg font-bold text-emerald-600 font-mono mt-0.5 block">{stats.scheduled}</span>
        </div>

        <div className="p-3 rounded-xl border bg-card shadow-2xs">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">Configured Week Offs</span>
          <span className="text-lg font-bold text-amber-600 font-mono mt-0.5 block">{stats.weekOff}</span>
        </div>

        <div className="p-3 rounded-xl border bg-card shadow-2xs">
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium block">Approved Leave</span>
          <span className="text-lg font-bold text-rose-600 font-mono mt-0.5 block">{stats.onLeave}</span>
        </div>

        <div className="p-3 rounded-xl border bg-card shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Unassigned Cells</span>
          <span className="text-lg font-bold text-slate-600 dark:text-slate-300 font-mono mt-0.5 block">{stats.unassigned}</span>
        </div>

        <div className={`p-3 rounded-xl border shadow-2xs flex flex-col justify-between ${
          stats.conflicts > 0 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200' : 'bg-card'
        }`}>
          <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium block">Schedule Conflicts</span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-lg font-bold text-rose-600 font-mono">{stats.conflicts}</span>
            {stats.conflicts > 0 && (
              <span className="text-[10px] font-semibold text-rose-600 underline cursor-pointer" onClick={() => setIsReviewModalOpen(true)}>
                Review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Save Status & Unsaved Changes Alert */}
      <div className="flex items-center justify-between text-xs px-1">
        {saveStatus && (
          <span className="text-emerald-600 font-bold font-mono animate-pulse">✓ {saveStatus}</span>
        )}
        {hasUnsavedChanges && !saveStatus && (
          <span className="text-amber-600 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Unsaved changes in roster draft. Remember to Save Draft or Publish.
          </span>
        )}
      </div>

      {/* 3. BULK ACTION TOOLBAR */}
      {selectedEmployeeIds.length > 0 && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <span className="font-bold text-xs text-primary">
            Selected Employees ({selectedEmployeeIds.length})
          </span>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold">Bulk Set:</span>

            {shifts.map(s => (
              <Button
                key={s.id}
                size="sm"
                variant="outline"
                onClick={() => applyBulkActionToEmployees('SHIFT', s.id)}
                className="h-7 text-[11px] font-bold"
              >
                {s.name}
              </Button>
            ))}

            <Button
              size="sm"
              variant="outline"
              onClick={() => applyBulkActionToEmployees('WEEK_OFF')}
              className="h-7 text-[11px] font-bold text-amber-600 border-amber-200"
            >
              Set Week Off
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => applyBulkActionToEmployees('LEAVE')}
              className="h-7 text-[11px] font-bold text-rose-600 border-rose-200"
            >
              Set Leave
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => applyBulkActionToEmployees('WFH')}
              className="h-7 text-[11px] font-bold text-emerald-600 border-emerald-200"
            >
              Set WFH
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedEmployeeIds([])}
              className="h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* 4. EXCEL-LIKE ROSTER GRID */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden flex flex-col">
        
        {/* Table Filter Subheader */}
        <div className="p-3 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Layers className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-xs text-foreground">
              Workforce Roster Grid ({selectedDepartmentName} • {selectedDesignationName})
            </span>
            {selectedShiftFilter !== 'ALL' && (
              <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold">
                Filtered: {selectedShiftFilter === 'UNASSIGNED' ? 'Unassigned' : shifts.find(s => s.id === selectedShiftFilter)?.name}
              </Badge>
            )}
            {shiftSortOrder === 'GROUP_BY_SHIFT' && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                Grouped by Shift 📂
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee by name/ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Grid Container (Sticky Employee Column) */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead className="bg-muted/40 border-b font-bold uppercase tracking-wider text-[11px]">
              <tr>
                {/* Sticky Employee Header Column */}
                <th className="p-3 pl-4 sticky left-0 z-20 bg-card border-r w-[240px] shadow-2xs">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={filteredGrid.length > 0 && selectedEmployeeIds.length === filteredGrid.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 cursor-pointer"
                    />
                    <span>Employee Profile</span>
                  </div>
                </th>

                {/* Configured Week Off Column Header (Before Sunday) */}
                <th className="p-2.5 text-center border-r min-w-[125px] align-top bg-amber-500/5">
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold uppercase tracking-wider">
                      Configured Off
                    </span>
                    <span className="text-[11px] font-extrabold text-foreground font-mono">
                      WEEK OFF
                    </span>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 text-[9px] px-1.5 py-0 font-bold">
                      Rule
                    </Badge>
                  </div>
                </th>

                {/* 7 Days Headers (Sun to Sat) */}
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(currentWeekSunday);
                  d.setDate(currentWeekSunday.getDate() + i);
                  const dateStr = formatDateToYYYYMMDD(d);
                  const isToday = dateStr === todayStr;
                  const dayNameShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                  const dateShort = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase();
                  const metrics = getDailyMetricsForDate(dateStr);

                  return (
                    <th 
                      key={dateStr} 
                      className={`p-2.5 text-center border-r min-w-[155px] align-top transition-colors ${
                        isToday ? 'bg-primary/10 text-primary border-primary/30 font-black' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] text-muted-foreground">{dayNameShort}</span>
                        <span className="font-extrabold text-xs text-foreground font-mono">{dateShort}</span>
                        {isToday && (
                          <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 font-bold">
                            TODAY
                          </Badge>
                        )}

                        {/* Column Quick Action Links */}
                        <div className="mt-0.5 flex items-center gap-1">
                          <button
                            type="button"
                            title="Set Shift for all employees on this day"
                            onClick={() => {
                              const targetShift = shifts[0]?.id;
                              if (targetShift) applyBulkActionToDay(dateStr, 'SHIFT', targetShift);
                            }}
                            className="text-[9px] font-semibold text-primary hover:underline"
                          >
                            Set Shift All
                          </button>
                          <span className="text-muted-foreground">•</span>
                          <button
                            type="button"
                            title="Set Week Off for all employees on this day"
                            onClick={() => applyBulkActionToDay(dateStr, 'WEEK_OFF')}
                            className="text-[9px] font-semibold text-amber-600 hover:underline"
                          >
                            OFF All
                          </button>
                        </div>

                        {/* Enterprise Staffing & Headcount Integrated Card */}
                        <div className="mt-1.5 w-full flex flex-col gap-1 text-[10px] font-mono normal-case tracking-normal">
                          {/* On Shift Summary Pill */}
                          <div 
                            title={`${metrics.workingCount} out of ${metrics.totalEmployees} scheduled on shift`}
                            className="w-full py-1 px-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between font-extrabold text-emerald-700 dark:text-emerald-300"
                          >
                            <span>On Shift</span>
                            <span>{metrics.workingCount} <span className="text-[9px] font-semibold opacity-80">({metrics.totalEmployees > 0 ? Math.round((metrics.workingCount / metrics.totalEmployees) * 100) : 0}%)</span></span>
                          </div>

                          {/* Week Off & On Leave Sub-Row */}
                          <div className="grid grid-cols-2 gap-1 font-bold">
                            <div 
                              title={`${metrics.weekOff} employees on week off`}
                              className="py-0.5 px-1.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-amber-700 dark:text-amber-400 text-[9.5px]"
                            >
                              <span className="truncate">Week Off</span>
                              <span>{metrics.weekOff}</span>
                            </div>

                            <div 
                              title={`${metrics.leave} employees on leave`}
                              className="py-0.5 px-1.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between text-rose-700 dark:text-rose-400 text-[9.5px]"
                            >
                              <span className="truncate">On Leave</span>
                              <span>{metrics.leave}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-muted-foreground">
                    <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading weekly roster schedule...
                  </td>
                </tr>
              ) : filteredGrid.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-muted-foreground">
                    No active employees found for the selected Department, Designation & Shift.
                  </td>
                </tr>
              ) : groupedGrid ? (
                groupedGrid.map((group) => (
                  <React.Fragment key={`group-${group.shift?.id || 'unassigned'}`}>
                    {/* Enterprise Shift Banner Header */}
                    <tr className="bg-muted/50 border-y">
                      <td colSpan={9} className="p-2.5 pl-4 sticky left-0 z-10 bg-muted/50 border-r font-extrabold text-foreground shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-bold text-foreground">
                            {group.shift ? `${group.shift.name} (${group.shift.startTime} – ${group.shift.endTime})` : 'Unassigned / Default Shift'}
                          </span>
                          <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] font-mono font-bold px-2 py-0.5">
                            {group.employees.length} Employees
                          </Badge>
                        </div>
                      </td>
                    </tr>
                    {group.employees.map((row) => {
                      const isSelected = selectedEmployeeIds.includes(row.id);

                      return (
                        <tr key={row.id} className={`hover:bg-muted/15 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                          
                          {/* Sticky Employee Left Column */}
                          <td className="p-3 pl-4 sticky left-0 z-10 bg-card border-r font-medium shadow-2xs">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectEmployee(row.id)}
                                className="rounded border-slate-300 cursor-pointer"
                              />
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-xs">
                                {row.firstName.charAt(0).toUpperCase()}
                              </div>
                              <div className="overflow-hidden">
                                <span className="font-bold text-foreground block truncate text-xs">
                                  {row.firstName} {row.lastName}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono block">
                                  {row.employeeId}
                                </span>
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {row.designation?.name || 'Associate'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Configured Week Off Column Cell (Before Sunday) */}
                          <td className="p-2 border-r text-center align-middle bg-amber-500/5 font-semibold text-xs min-w-[125px]">
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold text-[11px] px-2 py-0.5 whitespace-nowrap">
                              {getEmployeeWeekOffDays(row)}
                            </Badge>
                          </td>

                          {/* 7 Days Cells */}
                          {Array.from({ length: 7 }, (_, i) => {
                            const d = new Date(currentWeekSunday);
                            d.setDate(currentWeekSunday.getDate() + i);
                            const targetDateStr = formatDateToYYYYMMDD(d);
                            const day = row.days.find(dayItem => dayItem.date === targetDateStr) || row.days[i] || {
                              date: targetDateStr,
                              dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
                              type: 'SHIFT',
                              shiftId: null
                            };
                            const isToday = targetDateStr === todayStr;

                            return (
                              <td 
                                key={targetDateStr}
                                onClick={() => {
                                  setEditingCell({ row, day });
                                  setIsCellModalOpen(true);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    employeeId: row.id,
                                    date: day.date
                                  });
                                }}
                                className={`p-2 border-r text-center align-middle cursor-pointer hover:bg-primary/10 transition-all select-none group relative ${
                                  isToday ? 'bg-primary/5' : ''
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center gap-1 min-h-[48px]">
                                  
                                  {/* SHIFT CELL */}
                                  {day.type === 'SHIFT' && (
                                    day.shift ? (
                                      <Badge className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 font-bold px-2 py-1 flex flex-col items-center text-[10px] leading-tight">
                                        <span className="font-extrabold">{day.shift.name}</span>
                                        <span className="font-mono text-[9px] font-normal text-blue-600 dark:text-blue-400">
                                          {day.shift.startTime}–{day.shift.endTime}
                                        </span>
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-slate-100 text-slate-600 text-[10px]">
                                        General (09-18)
                                      </Badge>
                                    )
                                  )}

                                  {/* WEEK OFF CELL */}
                                  {day.type === 'WEEK_OFF' && (
                                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-extrabold text-[10px] px-2.5 py-1">
                                      OFF
                                    </Badge>
                                  )}

                                  {/* LEAVE CELL */}
                                  {day.type === 'LEAVE' && (
                                    <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-extrabold text-[10px] px-2 py-1 flex flex-col items-center">
                                      <span>{day.leaveType || 'LEAVE'}</span>
                                    </Badge>
                                  )}

                                  {/* HOLIDAY CELL */}
                                  {day.type === 'HOLIDAY' && (
                                    <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 font-extrabold text-[10px] px-2 py-1 flex flex-col items-center">
                                      <span>HOLIDAY</span>
                                      {day.holidayName && <span className="text-[9px] font-normal truncate max-w-[90px]">{day.holidayName}</span>}
                                    </Badge>
                                  )}

                                  {/* WFH CELL */}
                                  {day.type === 'WFH' && (
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-extrabold text-[10px] px-2.5 py-1">
                                      WFH
                                    </Badge>
                                  )}

                                  {/* HALF DAY CELL */}
                                  {day.type === 'HALF_DAY' && (
                                    <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 font-extrabold text-[10px] px-2.5 py-1">
                                      HALF DAY
                                    </Badge>
                                  )}

                                  {/* Approved leave indicator icon */}
                                  {day.hasApprovedLeave && day.type === 'SHIFT' && (
                                    <div title={`Approved leave exists: ${day.approvedLeaveType}`} className="absolute top-1 right-1">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              ) : (
                filteredGrid.map((row) => {
                  const isSelected = selectedEmployeeIds.includes(row.id);

                  return (
                    <tr key={row.id} className={`hover:bg-muted/15 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                      
                      {/* Sticky Employee Left Column */}
                      <td className="p-3 pl-4 sticky left-0 z-10 bg-card border-r font-medium shadow-2xs">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectEmployee(row.id)}
                            className="rounded border-slate-300 cursor-pointer"
                          />
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-xs">
                            {row.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-bold text-foreground block truncate text-xs">
                              {row.firstName} {row.lastName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              {row.employeeId}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {row.designation?.name || 'Associate'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Configured Week Off Column Cell (Before Sunday) */}
                      <td className="p-2 border-r text-center align-middle bg-amber-500/5 font-semibold text-xs min-w-[125px]">
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold text-[11px] px-2 py-0.5 whitespace-nowrap">
                          {getEmployeeWeekOffDays(row)}
                        </Badge>
                      </td>

                      {/* 7 Days Cells */}
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(currentWeekSunday);
                        d.setDate(currentWeekSunday.getDate() + i);
                        const targetDateStr = formatDateToYYYYMMDD(d);
                        const day = row.days.find(dayItem => dayItem.date === targetDateStr) || row.days[i] || {
                          date: targetDateStr,
                          dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
                          type: 'SHIFT',
                          shiftId: null
                        };
                        const isToday = targetDateStr === todayStr;

                        return (
                          <td 
                            key={targetDateStr}
                            onClick={() => {
                              setEditingCell({ row, day });
                              setIsCellModalOpen(true);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                employeeId: row.id,
                                date: day.date
                              });
                            }}
                            className={`p-2 border-r text-center align-middle cursor-pointer hover:bg-primary/10 transition-all select-none group relative ${
                              isToday ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center gap-1 min-h-[48px]">
                              
                              {/* SHIFT CELL */}
                              {day.type === 'SHIFT' && (
                                day.shift ? (
                                  <Badge className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 font-bold px-2 py-1 flex flex-col items-center text-[10px] leading-tight">
                                    <span className="font-extrabold">{day.shift.name}</span>
                                    <span className="font-mono text-[9px] font-normal text-blue-600 dark:text-blue-400">
                                      {day.shift.startTime}–{day.shift.endTime}
                                    </span>
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-slate-100 text-slate-600 text-[10px]">
                                    General (09-18)
                                  </Badge>
                                )
                              )}

                              {/* WEEK OFF CELL */}
                              {day.type === 'WEEK_OFF' && (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-extrabold text-[10px] px-2.5 py-1">
                                  OFF
                                </Badge>
                              )}

                              {/* LEAVE CELL */}
                              {day.type === 'LEAVE' && (
                                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-extrabold text-[10px] px-2 py-1 flex flex-col items-center">
                                  <span>{day.leaveType || 'LEAVE'}</span>
                                </Badge>
                              )}

                              {/* HOLIDAY CELL */}
                              {day.type === 'HOLIDAY' && (
                                <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 font-extrabold text-[10px] px-2 py-1 flex flex-col items-center">
                                  <span>HOLIDAY</span>
                                  {day.holidayName && <span className="text-[9px] font-normal truncate max-w-[90px]">{day.holidayName}</span>}
                                </Badge>
                              )}

                              {/* WFH CELL */}
                              {day.type === 'WFH' && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-extrabold text-[10px] px-2.5 py-1">
                                  WFH
                                </Badge>
                              )}

                              {/* HALF DAY CELL */}
                              {day.type === 'HALF_DAY' && (
                                <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 font-extrabold text-[10px] px-2.5 py-1">
                                  HALF DAY
                                </Badge>
                              )}

                              {/* Approved leave indicator icon */}
                              {day.hasApprovedLeave && day.type === 'SHIFT' && (
                                <div title={`Approved leave exists: ${day.approvedLeaveType}`} className="absolute top-1 right-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                    </tr>
                  );
                })
              )}
            </tbody>


          </table>
        </div>
      </div>

      {/* 5. RIGHT CLICK CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-card border rounded-xl shadow-xl p-1 text-xs w-44 font-semibold text-foreground animate-in fade-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase border-b">
            Quick Roster Action
          </div>
          {shifts.map(s => (
            <button
              key={s.id}
              onClick={() => applyQuickAction(contextMenu.employeeId, contextMenu.date, 'SHIFT', s.id)}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-primary/10 text-xs flex items-center justify-between"
            >
              <span>{s.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{s.startTime}</span>
            </button>
          ))}
          <button
            onClick={() => applyQuickAction(contextMenu.employeeId, contextMenu.date, 'WEEK_OFF')}
            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-500/10 text-amber-700 text-xs font-bold"
          >
            Set Week Off (OFF)
          </button>
          <button
            onClick={() => applyQuickAction(contextMenu.employeeId, contextMenu.date, 'LEAVE')}
            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-rose-500/10 text-rose-700 text-xs font-bold"
          >
            Set Leave
          </button>
          <button
            onClick={() => applyQuickAction(contextMenu.employeeId, contextMenu.date, 'WFH')}
            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-emerald-500/10 text-emerald-700 text-xs font-bold"
          >
            Set WFH
          </button>
          <div className="border-t my-1"></div>
          <button
            onClick={() => setContextMenu(null)}
            className="w-full text-left px-2.5 py-1 rounded hover:bg-muted text-[11px] text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Close context menu on outside click */}
      {contextMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
      )}

      {/* 6. MODALS */}
      <RosterCellEditorModal
        isOpen={isCellModalOpen}
        onClose={() => {
          setIsCellModalOpen(false);
          setEditingCell(null);
        }}
        cellData={editingCell ? {
          employeeId: editingCell.row.id,
          employeeName: `${editingCell.row.firstName} ${editingCell.row.lastName}`,
          employeeCode: editingCell.row.employeeId,
          date: editingCell.day.date,
          dayName: editingCell.day.dayName,
          type: editingCell.day.type,
          shiftId: editingCell.day.shiftId,
          leaveType: editingCell.day.leaveType || null,
          notes: editingCell.day.notes || null,
          hasApprovedLeave: editingCell.day.hasApprovedLeave,
          approvedLeaveType: editingCell.day.approvedLeaveType,
          isHoliday: editingCell.day.isHoliday,
          holidayName: editingCell.day.holidayName,
          isOverridden: editingCell.day.isOverridden,
          overrideReason: editingCell.day.overrideReason
        } : null}
        shifts={shifts}
        onSave={handleSaveCell}
      />

      <RosterReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        departmentName={selectedDepartmentName}
        designationName={selectedDesignationName}
        weekStartStr={formattedWeekRangeStr.split(' – ')[0]}
        weekEndStr={formattedWeekRangeStr.split(' – ')[1]}
        stats={stats}
        conflicts={conflicts}
        onConfirmPublish={handleConfirmPublish}
        isPublishing={publishing}
      />

      <RosterImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        departmentId={selectedDeptId}
        designationId={selectedDesigId}
        weekStart={getWeekStartStr(currentWeekSunday)}
        onImportSuccess={() => loadRoster()}
      />

    </div>
  );
}
