"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AttendanceRecordDto } from "./AttendanceTable";

interface AttendanceCorrectionModalProps {
  record: AttendanceRecordDto | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    attendanceRecordId: string;
    employeeId: string;
    date: string;
    punchIn: string;
    punchOut: string;
    status: string;
    reason: string;
  }) => Promise<void>;
}

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  record,
  open,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    date: "",
    punchIn: "",
    punchOut: "",
    status: "PRESENT",
    reason: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      // Use local date string YYYY-MM-DD instead of UTC toISOString() to prevent day shift in local timezone
      const d = new Date(record.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const pInTime = record.punchInTime || record.logs?.[0]?.punchIn;
      const pOutTime = record.punchOutTime || (record.logs && record.logs.length > 0 ? record.logs[record.logs.length - 1].punchOut : null);

      const pInStr = pInTime ? new Date(pInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "";
      const pOutStr = pOutTime ? new Date(pOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "";

      setFormData({
        date: dateStr,
        punchIn: pInStr,
        punchOut: pOutStr,
        status: record.rawStatus || "PRESENT",
        reason: ""
      });
    }
  }, [record]);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      alert("Reason for correction is required for audit trail.");
      return;
    }

    setIsSubmitting(true);
    try {
      const punchInIso = formData.punchIn ? new Date(`${formData.date}T${formData.punchIn}`).toISOString() : "";
      const punchOutIso = formData.punchOut ? new Date(`${formData.date}T${formData.punchOut}`).toISOString() : "";

      await onSubmit({
        attendanceRecordId: record.id,
        employeeId: record.employee?.id || record.employeeId,
        date: formData.date,
        punchIn: punchInIso,
        punchOut: punchOutIso,
        status: formData.status,
        reason: formData.reason.trim()
      });
      onClose();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to correct attendance record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const empName = record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : record.employeeId;

  return (
    <Dialog open={open} onOpenChange={openState => !openState && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            Correct Attendance — {empName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold block mb-1">Date</label>
            <Input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Punch In Time</label>
              <Input
                type="time"
                value={formData.punchIn}
                onChange={e => setFormData({ ...formData, punchIn: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Punch Out Time</label>
              <Input
                type="time"
                value={formData.punchOut}
                onChange={e => setFormData({ ...formData, punchOut: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Status Override</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full h-9 rounded-md border bg-background px-3 text-xs"
            >
              <option value="PRESENT">Present (≥ 8h)</option>
              <option value="HALF_DAY">Half Day (4h–8h)</option>
              <option value="INSUFFICIENT_HOURS">Insufficient Hours (&lt; 4h)</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">
              Reason for Correction <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              placeholder="Explain why this attendance record is being modified (e.g. Employee biometric machine glitch)..."
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full rounded-md border bg-background p-2 text-xs focus:ring-1 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              This action will be logged in the immutable Audit Log.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isSubmitting ? "Updating..." : "Save Correction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
