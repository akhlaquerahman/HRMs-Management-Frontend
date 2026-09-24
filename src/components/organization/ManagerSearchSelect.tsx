"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Check, UserCheck, ShieldCheck, Mail, IdCard, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SearchableEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email?: string;
  photo?: string | null;
  designation?: { name?: string } | string;
  department?: { name?: string } | string;
}

interface ManagerSearchSelectProps {
  employees: SearchableEmployee[];
  value: string;
  onChange: (id: string) => void;
  excludeEmployeeId?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function ManagerSearchSelect({
  employees = [],
  value,
  onChange,
  excludeEmployeeId,
  placeholder = "Search & select manager by name, email or ID...",
  label = "Department Manager",
  disabled = false,
}: ManagerSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Selected manager object
  const selectedManager = useMemo(() => {
    return employees.find((emp) => emp.id === value) || null;
  }, [employees, value]);

  // Filtered employees list based on search query (Name, Email, Employee ID, Designation)
  const filteredEmployees = useMemo(() => {
    const eligible = excludeEmployeeId
      ? employees.filter((e) => e.id !== excludeEmployeeId)
      : employees;

    if (!searchQuery.trim()) return eligible.slice(0, 100); // Top 100 for fast rendering

    const q = searchQuery.toLowerCase().trim();
    return eligible.filter((emp) => {
      const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      const empId = (emp.employeeId || "").toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const desig = typeof emp.designation === "object" ? emp.designation?.name || "" : emp.designation || "";
      const dept = typeof emp.department === "object" ? emp.department?.name || "" : emp.department || "";

      return (
        fullName.includes(q) ||
        empId.includes(q) ||
        email.includes(q) ||
        desig.toLowerCase().includes(q) ||
        dept.toLowerCase().includes(q)
      );
    });
  }, [employees, excludeEmployeeId, searchQuery]);

  const handleSelect = (empId: string) => {
    onChange(empId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  // Helper function for color-coded initials badge
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-600 text-white",
      "bg-emerald-600 text-white",
      "bg-purple-600 text-white",
      "bg-amber-600 text-white",
      "bg-indigo-600 text-white",
      "bg-rose-600 text-white",
      "bg-teal-600 text-white",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-1.5 w-full relative" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            {label}
          </label>
          <span className="text-[11px] text-gray-400">
            Search by Name, ID or Email
          </span>
        </div>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-all duration-150 text-sm ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-100 bg-white"
            : "border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {selectedManager ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${getAvatarColor(
                `${selectedManager.firstName} ${selectedManager.lastName}`
              )}`}
            >
              {selectedManager.firstName?.[0] || ""}
              {selectedManager.lastName?.[0] || ""}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">
                  {selectedManager.firstName} {selectedManager.lastName}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 font-mono">
                  {selectedManager.employeeId}
                </Badge>
              </div>
              {selectedManager.email && (
                <span className="text-[11px] text-gray-500 block truncate">
                  {selectedManager.email}
                </span>
              )}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                title="Clear manager selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <span className="text-gray-400 font-normal">{placeholder}</span>
        )}

        <ChevronDown
          className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </div>

      {/* Search Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box Header */}
          <div className="p-2.5 bg-gray-50/80 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type name, email or employee ID (e.g. EMP-101)..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-gray-500 font-medium">
              <span>Quick Manager Search</span>
              <span>
                Showing {filteredEmployees.length} of {employees.length} employees
              </span>
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {/* Unassign / Clear Option */}
            <div
              onClick={() => handleSelect("")}
              className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                value === "" ? "bg-blue-50/60 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                  <X className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium">-- No Manager Assigned (Unassign) --</span>
              </div>
              {value === "" && <Check className="h-4 w-4 text-blue-600" />}
            </div>

            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => {
                const isSelected = emp.id === value;
                const desigName = typeof emp.designation === "object" ? emp.designation?.name : emp.designation;

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp.id)}
                    className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/80 text-blue-900 font-medium"
                        : "hover:bg-blue-50/40 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(
                          `${emp.firstName} ${emp.lastName}`
                        )}`}
                      >
                        {emp.firstName?.[0] || ""}
                        {emp.lastName?.[0] || ""}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            <IdCard className="h-3 w-3 text-gray-400" />
                            {emp.employeeId}
                          </span>
                          {desigName && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              {desigName}
                            </span>
                          )}
                        </div>

                        {emp.email && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5 truncate">
                            <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="truncate">{emp.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Search className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">No managers found</p>
                <p className="text-xs text-gray-400 mt-1">
                  No employee matches &quot;{searchQuery}&quot;. Try searching by name, ID or email.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
