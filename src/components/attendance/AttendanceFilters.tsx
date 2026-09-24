"use client";

import React from "react";
import { Search, RotateCcw, Download, RefreshCw, SlidersHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

interface AttendanceFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  datePreset: string;
  setDatePreset: (val: string) => void;
  singleDate: string;
  setSingleDate: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  departmentId: string;
  setDepartmentId: (val: string) => void;
  designationId: string;
  setDesignationId: (val: string) => void;
  shiftId: string;
  setShiftId: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  breakType: string;
  setBreakType: (val: string) => void;
  departments: any[];
  designations: any[];
  shifts: any[];
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onReset: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isExporting?: boolean;
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  search,
  setSearch,
  datePreset,
  setDatePreset,
  singleDate,
  setSingleDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  departmentId,
  setDepartmentId,
  designationId,
  setDesignationId,
  shiftId,
  setShiftId,
  status,
  setStatus,
  breakType,
  setBreakType,
  departments,
  designations,
  shifts,
  visibleColumns,
  setVisibleColumns,
  onReset,
  onRefresh,
  onExport,
  isExporting
}) => {
  const columnLabels: Record<string, string> = {
    date: "Date",
    employee: "Employee",
    employeeId: "Employee ID",
    status: "Status",
    punchIn: "Punch In",
    punchOut: "Punch Out",
    sessionEnded: "Session Ended",
    lunch: "Lunch",
    tea: "Tea",
    bio: "Bio",
    official: "Official",
    personal: "Personal",
    breakTime: "Break Time",
    workingHours: "Working Hours",
    shift: "Shift"
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-3 border rounded-xl p-4 bg-card shadow-xs">
      {/* Top row: Search + Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Employee Name, ID, or Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-lg"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* Column Visibility Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium w-full justify-center">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-2" align="end">
              <DropdownMenuLabel className="text-xs font-bold">Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-60 overflow-y-auto pr-1">
                {Object.keys(columnLabels).map(key => (
                  <DropdownMenuItem
                    key={key}
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleColumn(key);
                    }}
                    className="text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[key] !== false}
                      onChange={() => {}}
                      className="rounded text-primary focus:ring-primary pointer-events-none"
                    />
                    <span>{columnLabels[key]}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={onReset} className="h-9 gap-1.5 text-xs font-medium w-full justify-center">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>

          <Button variant="outline" size="sm" onClick={onRefresh} className="h-9 gap-1.5 text-xs font-medium w-full justify-center">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button size="sm" onClick={onExport} disabled={isExporting} className="h-9 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white w-full justify-center">
            <Download className="h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </div>

      {/* Filter Row: Select Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t">
        {/* Date Preset & Selector */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">DATE PRESET</label>
          <select
            value={datePreset}
            onChange={e => {
              const val = e.target.value;
              setDatePreset(val);
              if (val === "TODAY") {
                setSingleDate(new Date().toISOString().split('T')[0]);
              } else if (val === "YESTERDAY") {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setSingleDate(y.toISOString().split('T')[0]);
              }
            }}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 font-medium shadow-xs"
          >
            <option value="SPECIFIC_DATE">Specific Date (Picker)</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="CUSTOM">Custom Range</option>
          </select>
        </div>

        {/* Date Input for Specific Date selection */}
        {(datePreset === "SPECIFIC_DATE" || datePreset === "TODAY" || datePreset === "YESTERDAY") && (
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">MANUAL DATE</label>
            <Input
              type="date"
              value={singleDate}
              onChange={e => {
                setSingleDate(e.target.value);
                setDatePreset("SPECIFIC_DATE");
              }}
              className="h-8 text-xs px-2 font-semibold text-primary"
            />
          </div>
        )}

        {/* Custom Range Start */}
        {datePreset === "CUSTOM" && (
          <>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">START DATE</label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-8 text-xs px-2"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">END DATE</label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-8 text-xs px-2"
              />
            </div>
          </>
        )}

        {/* Status Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">ATTENDANCE STATUS</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 font-medium shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present (≥ 8h)</option>
            <option value="CURRENTLY_WORKING">Currently Working 🟢</option>
            <option value="ON_BREAK">On Break ☕</option>
            <option value="HALF_DAY">Half Day (4h–8h)</option>
            <option value="INSUFFICIENT_HOURS">Insufficient Hours (&lt; 4h)</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">Leave</option>
            <option value="HOLIDAY">Holiday</option>
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">DEPARTMENT</label>
          <select
            value={departmentId}
            onChange={e => setDepartmentId(e.target.value)}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 font-medium shadow-xs"
          >
            <option value="ALL">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Designation Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">DESIGNATION</label>
          <select
            value={designationId}
            onChange={e => setDesignationId(e.target.value)}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 font-medium shadow-xs"
          >
            <option value="ALL">All Designations</option>
            {designations.map(des => (
              <option key={des.id} value={des.id}>{des.title || des.name}</option>
            ))}
          </select>
        </div>

        {/* Shift Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">SHIFT</label>
          <select
            value={shiftId}
            onChange={e => setShiftId(e.target.value)}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 font-medium shadow-xs"
          >
            <option value="ALL">All Shifts</option>
            {shifts.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Break Type Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">BREAK TYPE</label>
          <select
            value={breakType}
            onChange={e => setBreakType(e.target.value)}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 font-medium shadow-xs"
          >
            <option value="ALL">All Break Types</option>
            <option value="LUNCH">Lunch</option>
            <option value="TEA">Tea</option>
            <option value="BIO">Bio</option>
            <option value="OFFICIAL">Official</option>
            <option value="PERSONAL">Personal</option>
          </select>
        </div>
      </div>
    </div>
  );
};
