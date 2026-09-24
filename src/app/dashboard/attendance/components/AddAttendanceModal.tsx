"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AddAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAttendanceModal({ isOpen, onClose }: AddAttendanceModalProps) {
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [punchIn, setPunchIn] = useState("");
  const [punchOut, setPunchOut] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [status, setStatus] = useState("PRESENT");

  const { data: employeesRes, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employeesList"],
    queryFn: async () => (await api.get("/employees")).data,
    enabled: isOpen
  });

  const { data: shiftsRes } = useQuery({
    queryKey: ["shiftsList"],
    queryFn: async () => (await api.get("/shifts")).data,
    enabled: isOpen
  });

  const employees = Array.isArray(employeesRes?.data) ? employeesRes.data : (employeesRes?.data?.data || employeesRes || []);
  const shifts = shiftsRes?.data || shiftsRes || [];

  const addMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/attendance/manual", payload)).data;
    },
    onSuccess: () => {
      toast.success("Attendance record added successfully");
      queryClient.invalidateQueries({ queryKey: ["attendanceOpsList"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceOpsSummary"] });
      onClose();
      // reset form
      setEmployeeId("");
      setDate("");
      setPunchIn("");
      setPunchOut("");
      setShiftId("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to add attendance");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !date || !punchIn) {
      toast.error("Employee, Date, and Check-In time are required");
      return;
    }

    // construct ISO strings
    const checkInDateTime = new Date(`${date}T${punchIn}`).toISOString();
    const checkOutDateTime = punchOut ? new Date(`${date}T${punchOut}`).toISOString() : undefined;

    addMutation.mutate({
      employeeId,
      date,
      punchIn: checkInDateTime,
      punchOut: checkOutDateTime,
      shiftId: shiftId || undefined,
      status
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Manual Attendance</DialogTitle>
          <DialogDescription>Create an attendance record directly for any employee.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} disabled={loadingEmployees}>
              <SelectTrigger>
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(employees) && employees.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label>Check In Time *</Label>
              <Input type="time" value={punchIn} onChange={e => setPunchIn(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label>Check Out Time</Label>
              <Input type="time" value={punchOut} onChange={e => setPunchOut(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={shiftId} onValueChange={setShiftId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standard Shift</SelectItem>
                  {Array.isArray(shifts) && shifts.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
