"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AttendancePunchModalProps {
  open: boolean;
  onClose: () => void;
  employees: any[];
  onSubmitPunchIn: (data: { employeeId: string; date?: string; punchInTime?: string; reason?: string }) => Promise<void>;
}

export const AttendancePunchModal: React.FC<AttendancePunchModalProps> = ({
  open,
  onClose,
  employees,
  onSubmitPunchIn
}) => {
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      alert("Please select an employee.");
      return;
    }

    setIsSubmitting(true);
    try {
      const punchInIso = time ? new Date(`${date}T${time}`).toISOString() : new Date().toISOString();
      await onSubmitPunchIn({
        employeeId,
        date,
        punchInTime: punchInIso,
        reason: reason.trim()
      });
      onClose();
      setEmployeeId("");
      setTime("");
      setReason("");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to punch in for employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={openState => !openState && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            HR Attendance Punch In
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold block mb-1">Select Employee <span className="text-rose-500">*</span></label>
            <select
              required
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-xs"
            >
              <option value="" disabled>-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Date</label>
              <Input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Time (Optional)</label>
              <Input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Remarks / Reason</label>
            <Input
              placeholder="e.g. Manual Punch In requested by HR..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary text-primary-foreground">
              {isSubmitting ? "Executing Punch In..." : "Confirm Punch In"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
