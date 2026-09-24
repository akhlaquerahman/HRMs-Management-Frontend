"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export function EditAttendanceModal({ isOpen, onClose, record }: EditAttendanceModalProps) {
  const queryClient = useQueryClient();
  const [punchIn, setPunchIn] = useState("");
  const [punchOut, setPunchOut] = useState("");
  const [status, setStatus] = useState("");
  const [shiftId, setShiftId] = useState("");

  const { data: shiftsRes } = useQuery({
    queryKey: ['shiftsList'],
    queryFn: async () => (await api.get('/shifts')).data
  });

  const shifts = shiftsRes?.data || shiftsRes || [];

  useEffect(() => {
    if (record && isOpen) {
      const inTime = record.logs?.[0]?.punchIn ? new Date(record.logs[0].punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "";
      const outTime = record.logs?.[record.logs.length - 1]?.punchOut ? new Date(record.logs[record.logs.length - 1].punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "";
      setPunchIn(inTime);
      setPunchOut(outTime);
      setStatus(record.status || "PRESENT");
      setShiftId(record.shiftId || "");
    }
  }, [record, isOpen]);

  const editMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.put(`/attendance/${record.id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success("Attendance record updated successfully");
      queryClient.invalidateQueries({ queryKey: ["attendanceOpsList"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceOpsSummary"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update attendance");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    const dateOnly = new Date(record.date).toISOString().split('T')[0];
    const checkInDateTime = punchIn ? new Date(`${dateOnly}T${punchIn}`).toISOString() : undefined;
    const checkOutDateTime = punchOut ? new Date(`${dateOnly}T${punchOut}`).toISOString() : undefined;

    editMutation.mutate({
      employeeId: record.employeeId,
      date: dateOnly,
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
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogDescription>Modify the attendance record for {record?.employee?.firstName}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check In Time</Label>
              <Input type="time" value={punchIn} onChange={e => setPunchIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check Out Time</Label>
              <Input type="time" value={punchOut} onChange={e => setPunchOut(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Shift</Label>
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts?.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
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
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
