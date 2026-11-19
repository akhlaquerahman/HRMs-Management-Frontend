"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getSocket } from '@/lib/socket';
import { 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  RefreshCw, 
  ExternalLink, 
  Search, 
  Building2, 
  Crosshair, 
  Clock,
  ShieldCheck,
  Compass,
  LayoutGrid,
  Table as TableIcon,
  X,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardAttendanceMapWrapper } from './DashboardAttendanceMapWrapper';
import type { PresentEmployeeLocation, DashboardOfficeLocation } from './DashboardAttendanceMap';

export interface DepartmentAttendanceSummaryItem {
  department: string;
  present: number;
  absent: number;
  onLeave: number;
}

// Enterprise Haversine distance calculator (exact meters)
function computeHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371000; // Mean Earth radius in meters
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const rLat1 = lat1 * toRad;
  const rLat2 = lat2 * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

interface LiveAttendanceMapSectionProps {
  deptAttendance?: DepartmentAttendanceSummaryItem[];
}

export function LiveAttendanceMapSection({ deptAttendance = [] }: LiveAttendanceMapSectionProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<PresentEmployeeLocation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'INSIDE' | 'OUTSIDE'>('ALL');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [deptViewMode, setDeptViewMode] = useState<'cards' | 'table'>('cards');

  // Fetch workforce map data from the secure backend
  const { data: workforceRes, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['dashboard_workforce_map'],
    queryFn: async () => {
      const res = await api.get('/workforce/map');
      return res.data?.data;
    },
    refetchInterval: 30000, // Poll every 30s as fallback
  });

  // Real-time Socket sync for instantaneous punch-in / punch-out reflection
  useEffect(() => {
    const s = getSocket();
    const handleUpdate = () => {
      refetch();
    };

    s.on('attendance:punch-in', handleUpdate);
    s.on('attendance:punch-out', handleUpdate);
    s.on('employee:location-updated', handleUpdate);

    return () => {
      s.off('attendance:punch-in', handleUpdate);
      s.off('attendance:punch-out', handleUpdate);
      s.off('employee:location-updated', handleUpdate);
    };
  }, [refetch]);

  // Fetch company details to ensure profile-selected office headquarters is always synced
  const { data: companyRes } = useQuery({
    queryKey: ['company'],
    queryFn: async () => (await api.get('/company')).data?.data
  });

  const rawOffices: DashboardOfficeLocation[] = workforceRes?.offices || [];

  const offices: DashboardOfficeLocation[] = useMemo(() => {
    // Check localStorage cache as well for instant responsiveness
    let cachedLat: number | null = null;
    let cachedLng: number | null = null;
    let cachedAddr: string | null = null;
    let cachedRadius: number | null = null;
    try {
      const sLat = localStorage.getItem('hrms_company_lat');
      const sLng = localStorage.getItem('hrms_company_lng');
      const sAddr = localStorage.getItem('hrms_company_address');
      const sRad = localStorage.getItem('hrms_company_radius');
      if (sLat && sLng) {
        cachedLat = Number(sLat);
        cachedLng = Number(sLng);
      }
      if (sAddr) cachedAddr = sAddr;
      if (sRad) cachedRadius = Number(sRad);
    } catch (e) {}

    const resolvedLat = companyRes?.latitude ? Number(companyRes.latitude) : cachedLat;
    const resolvedLng = companyRes?.longitude ? Number(companyRes.longitude) : cachedLng;
    const resolvedAddress = companyRes?.companyAddress || cachedAddr;
    const resolvedRadius = companyRes?.radiusMeters ? Number(companyRes.radiusMeters) : (cachedRadius || 150);
    const resolvedName = companyRes?.companyName ? `${companyRes.companyName} Headquarters` : 'Office Headquarters';

    if (resolvedLat && resolvedLng) {
      const primaryHQ: DashboardOfficeLocation = {
        id: companyRes?.officeId || rawOffices[0]?.id || 'primary-hq-office',
        name: resolvedName,
        address: resolvedAddress || 'Office Headquarters',
        latitude: resolvedLat,
        longitude: resolvedLng,
        radiusMeters: resolvedRadius,
        isActive: true,
      };

      const otherOffices = rawOffices.filter(
        (o: DashboardOfficeLocation) => o.id !== primaryHQ.id && Math.abs(o.latitude - resolvedLat) > 0.001
      );
      return [primaryHQ, ...otherOffices];
    }

    return rawOffices;
  }, [rawOffices, companyRes]);

  const rawEmployees: any[] = workforceRes?.workforce || workforceRes?.employees || [];

  // Filter only employees who are currently punched in (active working session, NOT punched out)
  const presentEmployees: PresentEmployeeLocation[] = useMemo(() => {
    const primaryHQ = offices[0] || null;

    return rawEmployees
      .filter((emp: any) => {
        // Exclude anyone who has punched out or whose session is not actively open
        if (!emp.isCurrentlyPunchedIn) return false;
        if (emp.punchOutTime) return false;
        if (
          emp.attendanceStatus === 'PUNCHED_OUT' ||
          emp.attendanceStatus === 'COMPLETED' ||
          emp.attendanceStatus === 'ABSENT' ||
          emp.attendanceStatus === 'NOT_PUNCHED_IN'
        ) {
          return false;
        }

        // Must have an active punch-in timestamp
        if (!emp.punchInTime) return false;

        return true;
      })
      .map((emp: any) => {
        const empLat = emp.activeLocation?.latitude || emp.punchInCoordinates?.latitude;
        const empLon = emp.activeLocation?.longitude || emp.punchInCoordinates?.longitude;

        let distanceMeters = emp.distanceMeters ?? null;
        let geofenceStatus = emp.geofenceStatus || 'LOCATION_UNAVAILABLE';

        // Dynamically compute exact distance & geofence against the currently active primary office
        if (empLat && empLon && primaryHQ) {
          distanceMeters = computeHaversineDistanceMeters(
            Number(empLat),
            Number(empLon),
            Number(primaryHQ.latitude),
            Number(primaryHQ.longitude)
          );
          const radius = Number(primaryHQ.radiusMeters) || 150;
          geofenceStatus = distanceMeters <= radius ? 'INSIDE_OFFICE' : 'OUTSIDE_OFFICE';
        }

        const isInside = geofenceStatus === 'INSIDE_OFFICE';

        return {
          id: emp.id,
          employeeId: emp.employeeId,
          firstName: emp.firstName,
          lastName: emp.lastName || '',
          photo: emp.photo,
          department: emp.department || 'General',
          designation: emp.designation || 'Employee',
          attendanceStatus: emp.attendanceStatus || 'PRESENT',
          isCurrentlyPunchedIn: true,
          punchInTime: emp.punchInTime,
          punchOutTime: null,
          punchInCoordinates: emp.punchInCoordinates,
          activeLocation: emp.activeLocation,
          geofenceStatus,
          distanceMeters,
          isLiveTracking: Boolean(emp.isLiveTracking),
          trackingConsentStatus: emp.trackingConsentStatus || 'NOT_REQUESTED',
          markerColor: isInside ? 'green' : 'orange',
          markerLabel: isInside ? 'Inside Office' : 'Outside Office',
        };
      });
  }, [rawEmployees, offices]);

  // If the previously selected employee punches out and disappears, reset selected state
  useEffect(() => {
    if (selectedEmployee && !presentEmployees.some((e) => e.id === selectedEmployee.id)) {
      setSelectedEmployee(null);
    }
  }, [presentEmployees, selectedEmployee]);

  // Compute live counts strictly from currently active present workforce
  const totalPresent = presentEmployees.length;
  const insideOfficeCount = presentEmployees.filter(e => e.geofenceStatus === 'INSIDE_OFFICE').length;
  const outsideOfficeCount = presentEmployees.filter(e => e.geofenceStatus === 'OUTSIDE_OFFICE' || e.geofenceStatus === 'UNCERTAIN').length;
  const liveTrackingCount = presentEmployees.filter(e => e.isLiveTracking).length;
  const gpsVerifiedCount = presentEmployees.filter(
    e => Boolean(e.punchInCoordinates?.latitude || e.activeLocation?.latitude)
  ).length;

  // Filtered roster for sidebar list
  const filteredEmployees = useMemo(() => {
    return presentEmployees.filter((emp) => {
      // Status filter
      if (statusFilter === 'INSIDE' && emp.geofenceStatus !== 'INSIDE_OFFICE') return false;
      if (statusFilter === 'OUTSIDE' && emp.geofenceStatus !== 'OUTSIDE_OFFICE' && emp.geofenceStatus !== 'UNCERTAIN') return false;

      // Department filter
      if (selectedDept && (emp.department || '').toLowerCase() !== selectedDept.toLowerCase()) {
        return false;
      }

      // Search term
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const empId = emp.employeeId.toLowerCase();
      const dept = emp.department.toLowerCase();
      return fullName.includes(q) || empId.includes(q) || dept.includes(q);
    });
  }, [presentEmployees, statusFilter, selectedDept, searchTerm]);

  // Default office details for display
  const primaryOffice = offices[0] || null;

  return (
    <div className="flex flex-col bg-card border rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground tracking-tight">
              Live Attendance & Punch-In Location Map
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-Time GPS Tracking
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            View exact GPS punch-in coordinates, office geofence status, and location accuracy for all present employees.
          </p>
        </div>

        {/* Header Actions & Quick Nav */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-2.5 text-xs gap-1.5"
            title="Refresh location data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Department Attendance Summary & GPS Presence Strip (Between Header & Map) */}
      <div className="border-b bg-muted/15 flex flex-col">
        {/* Strip Header: Title, Department Count, Live GPS Status & View Toggle */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="font-bold text-xs uppercase tracking-wider text-foreground">
              Department Attendance Summary
            </span>
            {deptAttendance.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-2 py-0 h-4.5 bg-background font-semibold">
                {deptAttendance.length} {deptAttendance.length === 1 ? 'Department' : 'Departments'}
              </Badge>
            )}
            {selectedDept && (
              <button
                type="button"
                onClick={() => setSelectedDept(null)}
                className="text-[10px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full transition-colors"
                title="Clear department filter"
              >
                <span>Filter: {selectedDept}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Integrated GPS Status Chips & View Mode Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs bg-background/90 border rounded-lg px-2.5 py-1 shadow-2xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground hidden sm:inline">Present Today:</span>
                <span className="font-bold">{totalPresent}</span>
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground hidden sm:inline">Inside Office:</span>
                <span className="font-bold">{insideOfficeCount}</span>
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground hidden sm:inline">Outside (Remote):</span>
                <span className="font-bold">{outsideOfficeCount}</span>
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-muted-foreground hidden sm:inline">Live GPS:</span>
                <span className="font-bold">{liveTrackingCount}</span>
              </span>
            </div>

            {deptAttendance.length > 0 && (
              <div className="flex items-center bg-background p-0.5 rounded-lg border shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDeptViewMode('cards')}
                  className={`p-1 rounded transition-colors ${
                    deptViewMode === 'cards' 
                      ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeptViewMode('table')}
                  className={`p-1 rounded transition-colors ${
                    deptViewMode === 'table' 
                      ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Department Content Display (Cards or Table) */}
        {deptAttendance.length > 0 && (
          <div className="p-3 sm:p-4">
            {deptViewMode === 'cards' ? (
              <div className={`grid gap-2.5 ${
                deptAttendance.length === 1 
                  ? 'grid-cols-1' 
                  : deptAttendance.length === 2 
                  ? 'grid-cols-1 sm:grid-cols-2' 
                  : deptAttendance.length === 3 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}>
                {deptAttendance.map((item, idx) => {
                  const deptName = item.department || 'Department';
                  const total = item.present + item.onLeave + item.absent;
                  const rate = total > 0 ? Math.round((item.present / total) * 100) : 0;
                  const presentPct = total > 0 ? (item.present / total) * 100 : 0;
                  const leavePct = total > 0 ? (item.onLeave / total) * 100 : 0;
                  const absentPct = total > 0 ? (item.absent / total) * 100 : 0;
                  const isSelected = selectedDept === deptName;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDept(isSelected ? null : deptName)}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-2xs'
                          : 'bg-card hover:bg-muted/40 hover:border-muted-foreground/30 shadow-2xs'
                      }`}
                      title={`Click to filter map roster by ${deptName}`}
                    >
                      {/* Card Header: Dept Name, Headcount & Rate Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {deptName.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <h5 className="font-bold text-xs text-foreground truncate" title={deptName}>
                              {deptName}
                            </h5>
                            <span className="text-[10px] text-muted-foreground">
                              {total} {total === 1 ? 'employee' : 'employees'}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 h-5 font-bold shrink-0 ${
                            rate >= 80 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : rate >= 50 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {rate}%
                        </Badge>
                      </div>

                      {/* Stacked Ratio Progress Bar */}
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden flex shadow-inner">
                          {presentPct > 0 && (
                            <div
                              style={{ width: `${presentPct}%` }}
                              className="bg-emerald-500 h-full transition-all duration-300"
                              title={`${item.present} Present (${Math.round(presentPct)}%)`}
                            />
                          )}
                          {leavePct > 0 && (
                            <div
                              style={{ width: `${leavePct}%` }}
                              className="bg-amber-500 h-full transition-all duration-300"
                              title={`${item.onLeave} On Leave (${Math.round(leavePct)}%)`}
                            />
                          )}
                          {absentPct > 0 && (
                            <div
                              style={{ width: `${absentPct}%` }}
                              className="bg-rose-500/80 h-full transition-all duration-300"
                              title={`${item.absent} Absent (${Math.round(absentPct)}%)`}
                            />
                          )}
                        </div>
                      </div>

                      {/* 3 Metrics Pills */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-dashed text-center">
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-md py-1 px-1 border border-emerald-500/10">
                          <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                            {item.present}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-tight">
                            Present
                          </span>
                        </div>
                        <div className="bg-amber-500/5 dark:bg-amber-500/10 rounded-md py-1 px-1 border border-amber-500/10">
                          <span className="block text-xs font-bold text-amber-600 dark:text-amber-400 leading-tight">
                            {item.onLeave}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-tight">
                            Leave
                          </span>
                        </div>
                        <div className="bg-rose-500/5 dark:bg-rose-500/10 rounded-md py-1 px-1 border border-rose-500/10">
                          <span className="block text-xs font-bold text-rose-600 dark:text-rose-400 leading-tight">
                            {item.absent}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-tight">
                            Absent
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table Mode */
              <div className="overflow-x-auto rounded-xl border bg-background shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3.5">Department</th>
                      <th className="py-2.5 px-2.5 text-center">Total Staff</th>
                      <th className="py-2.5 px-2.5 text-center text-emerald-600 dark:text-emerald-400">Present</th>
                      <th className="py-2.5 px-2.5 text-center text-amber-600 dark:text-amber-400">On Leave</th>
                      <th className="py-2.5 px-2.5 text-center text-rose-600 dark:text-rose-400">Absent</th>
                      <th className="py-2.5 px-3 w-40">Presence Ratio</th>
                      <th className="py-2.5 px-3.5 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {deptAttendance.map((item, idx) => {
                      const deptName = item.department || 'Department';
                      const total = item.present + item.onLeave + item.absent;
                      const rate = total > 0 ? Math.round((item.present / total) * 100) : 0;
                      const presentPct = total > 0 ? (item.present / total) * 100 : 0;
                      const leavePct = total > 0 ? (item.onLeave / total) * 100 : 0;
                      const absentPct = total > 0 ? (item.absent / total) * 100 : 0;
                      const isSelected = selectedDept === deptName;

                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedDept(isSelected ? null : deptName)}
                          className={`hover:bg-muted/30 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5 font-semibold' : ''}`}
                        >
                          <td className="py-2 px-3.5 font-bold text-foreground flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {deptName.charAt(0).toUpperCase()}
                            </div>
                            <span>{deptName}</span>
                          </td>
                          <td className="py-2 px-2.5 text-center font-medium text-muted-foreground">{total}</td>
                          <td className="py-2 px-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{item.present}</td>
                          <td className="py-2 px-2.5 text-center font-bold text-amber-600 dark:text-amber-400">{item.onLeave}</td>
                          <td className="py-2 px-2.5 text-center font-bold text-rose-600 dark:text-rose-400">{item.absent}</td>
                          <td className="py-2 px-3">
                            <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden flex">
                              {presentPct > 0 && <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 h-full" />}
                              {leavePct > 0 && <div style={{ width: `${leavePct}%` }} className="bg-amber-500 h-full" />}
                              {absentPct > 0 && <div style={{ width: `${absentPct}%` }} className="bg-rose-500 h-full" />}
                            </div>
                          </td>
                          <td className="py-2 px-3.5 text-right font-bold">
                            <span className={rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Map (8 cols) + Present Employees Roster (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x">
        {/* Left: Interactive OpenStreetMap with Geofence & Markers */}
        <div className="lg:col-span-8 p-3 sm:p-4 flex flex-col gap-3">
          <div className="relative">
            <DashboardAttendanceMapWrapper
              employees={presentEmployees}
              offices={offices}
              selectedEmployee={selectedEmployee}
              onSelectEmployee={(emp) => setSelectedEmployee(emp)}
              heightClass="h-[420px] sm:h-[460px]"
            />

            {/* Quick Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg px-2.5 py-1.5 shadow-md flex items-center gap-3 text-[10px] font-medium text-foreground">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Inside Geofence
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Outside / Remote
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Live Sharing
              </span>
              <span className="hidden sm:flex items-center gap-1 text-sky-600">
                <span>🏢</span> Office Perimeter
              </span>
            </div>
          </div>

          {/* Office Geofence Info Strip */}
          {primaryOffice && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-semibold text-foreground">{primaryOffice.name}:</span>
                <span>{primaryOffice.address || 'Configured Office Headquarters'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-[10px]">
                  {primaryOffice.latitude.toFixed(4)}°, {primaryOffice.longitude.toFixed(4)}°
                </span>
                <span className="text-sky-600 font-medium">
                  Radius: {Math.round(primaryOffice.radiusMeters)}m
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Present Employees List & Exact Punch Coordinates */}
        <div className="lg:col-span-4 p-3 sm:p-4 flex flex-col gap-3 bg-muted/5">
          {/* List Header & Filter Tabs */}
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Present Today ({presentEmployees.length})</span>
            </h4>
            <span className="text-[10px] text-muted-foreground">
              {gpsVerifiedCount} GPS verified
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({presentEmployees.length})
            </button>
            <button
              onClick={() => setStatusFilter('INSIDE')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded transition-colors ${
                statusFilter === 'INSIDE'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inside ({insideOfficeCount})
            </button>
            <button
              onClick={() => setStatusFilter('OUTSIDE')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded transition-colors ${
                statusFilter === 'OUTSIDE'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Remote ({outsideOfficeCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search present employee..."
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          {/* Scrollable Employee Cards List */}
          <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1">
            {filteredEmployees.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 bg-background/50">
                <MapPin className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-xs font-semibold text-foreground">
                  {presentEmployees.length === 0
                    ? 'No employees currently punched in.'
                    : 'No matching employees found.'}
                </p>
                <p className="text-[11px] text-muted-foreground max-w-[240px]">
                  {presentEmployees.length === 0
                    ? 'Employees appear here on the map while actively punched in, and disappear when they punch out.'
                    : 'Try adjusting your search or status filter.'}
                </p>
                {presentEmployees.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-2 text-xs h-7 gap-1"
                  >
                    <Link href="/dashboard/attendance">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>View Attendance Records</span>
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                const lat = emp.activeLocation?.latitude || emp.punchInCoordinates?.latitude;
                const lon = emp.activeLocation?.longitude || emp.punchInCoordinates?.longitude;
                const hasCoords = Boolean(lat && lon);
                const punchInTimeFormatted = emp.punchInTime
                  ? new Date(emp.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                  : '--:--';

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      if (hasCoords) setSelectedEmployee(emp);
                    }}
                    className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-2xs'
                        : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/30'
                    }`}
                  >
                    {/* Header: Name, Initials, Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          emp.markerColor === 'green'
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : emp.markerColor === 'orange'
                            ? 'bg-amber-500/20 text-amber-600'
                            : 'bg-primary/20 text-primary'
                        }`}>
                          {emp.photo ? (
                            <img src={emp.photo} alt={emp.firstName} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <span>{emp.firstName.charAt(0)}{emp.lastName ? emp.lastName.charAt(0) : ''}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-foreground text-xs truncate">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {emp.employeeId} • {emp.department}
                          </div>
                        </div>
                      </div>

                      {/* Geofence Status Badge */}
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4 shrink-0 font-semibold ${
                          emp.geofenceStatus === 'INSIDE_OFFICE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : emp.geofenceStatus === 'OUTSIDE_OFFICE'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {emp.geofenceStatus === 'INSIDE_OFFICE' ? 'Inside' : 'Remote'}
                      </Badge>
                    </div>

                    {/* Punch-In Details & Exact Coordinates */}
                    <div className="mt-2 pt-2 border-t border-dashed space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary" />
                          <span>Punched In:</span>
                        </span>
                        <span className="font-semibold text-foreground">{punchInTimeFormatted}</span>
                      </div>

                      {hasCoords ? (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>GPS Location:</span>
                          </span>
                          <span className="font-mono text-[10px] bg-muted/60 px-1 py-0.5 rounded text-foreground font-semibold">
                            {lat!.toFixed(4)}°, {lon!.toFixed(4)}°
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                          Location unavailable for this punch
                        </div>
                      )}

                      {emp.distanceMeters !== null && emp.distanceMeters !== undefined && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Office Distance:</span>
                          <span className="font-semibold text-foreground">
                            {emp.distanceMeters >= 1000
                              ? `${(emp.distanceMeters / 1000).toFixed(2)} km away (${Math.round(emp.distanceMeters).toLocaleString()} m)`
                              : `${Math.round(emp.distanceMeters)} m away`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {hasCoords && (
                      <div className="mt-2 pt-1.5 flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(emp);
                          }}
                          className="h-6 px-2 text-[10px] font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Crosshair className="w-3 h-3" />
                          <span>Focus on Map</span>
                        </Button>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 px-2 text-[10px] font-semibold rounded flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
