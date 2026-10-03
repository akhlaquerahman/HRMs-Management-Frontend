"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Check, 
  FileText,
  Building2,
  X
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

interface ShiftOption {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  weeklyOff?: string[];
}

interface RosterCellData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  date: string;
  dayName: string;
  type: string; // SHIFT, WEEK_OFF, LEAVE, HOLIDAY, WFH, HALF_DAY
  shiftId: string | null;
  leaveType: string | null;
  notes: string | null;
  hasApprovedLeave?: boolean;
  approvedLeaveType?: string | null;
  isHoliday?: boolean;
  holidayName?: string | null;
  isOverridden?: boolean;
  overrideReason?: string | null;
}

interface RosterCellEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellData: RosterCellData | null;
  shifts: ShiftOption[];
  onSave: (updated: RosterCellData) => void;
}

export function RosterCellEditorModal({
  isOpen,
  onClose,
  cellData,
  shifts,
  onSave
}: RosterCellEditorModalProps) {
  const [type, setType] = useState<string>('SHIFT');
  const [shiftId, setShiftId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<string>('SICK');
  const [notes, setNotes] = useState<string>('');
  const [isOverridden, setIsOverridden] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showOverrideWarning, setShowOverrideWarning] = useState<boolean>(false);

  useEffect(() => {
    if (cellData) {
      setType(cellData.type || 'SHIFT');
      setShiftId(cellData.shiftId || (shifts[0]?.id || ''));
      setLeaveType(cellData.leaveType || 'SICK LEAVE');
      setNotes(cellData.notes || '');
      setIsOverridden(cellData.isOverridden || false);
      setOverrideReason(cellData.overrideReason || '');
      setShowOverrideWarning(false);
    }
  }, [cellData, shifts]);

  if (!cellData) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check conflict warning if user tries to assign SHIFT on approved leave or holiday without override
    if (type === 'SHIFT' && (cellData.hasApprovedLeave || cellData.isHoliday) && !isOverridden) {
      setShowOverrideWarning(true);
      return;
    }

    onSave({
      ...cellData,
      type,
      shiftId: type === 'SHIFT' ? shiftId : null,
      leaveType: type === 'LEAVE' ? leaveType : null,
      notes: notes || null,
      isOverridden,
      overrideReason: isOverridden ? overrideReason : null
    });
    onClose();
  };

  const formattedDate = new Date(cellData.date + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center justify-between">
            <span>Edit Daily Roster Cell</span>
            <Badge variant="outline" className="font-mono text-xs">
              {cellData.employeeCode}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {cellData.employeeName} • <span className="font-semibold text-foreground">{formattedDate}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
          
          {/* Approved Leave Warning Banner */}
          {cellData.hasApprovedLeave && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                  Approved Leave Detected ({cellData.approvedLeaveType || 'LEAVE'})
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  Employee has an approved leave request on this date. Assigning a shift requires a manager override justification.
                </span>
              </div>
            </div>
          )}

          {/* Holiday Warning Banner */}
          {cellData.isHoliday && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">
                  Official Organization Holiday ({cellData.holidayName})
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  This day is listed as a company holiday.
                </span>
              </div>
            </div>
          )}

          {/* Schedule Type Radio Group */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-2">Schedule Type</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'SHIFT', label: 'Shift Roster', color: 'border-blue-500 text-blue-600' },
                { id: 'WEEK_OFF', label: 'Week Off (OFF)', color: 'border-amber-500 text-amber-600' },
                { id: 'LEAVE', label: 'Leave', color: 'border-rose-500 text-rose-600' },
                { id: 'HOLIDAY', label: 'Holiday', color: 'border-indigo-500 text-indigo-600' },
                { id: 'WFH', label: 'Work From Home', color: 'border-emerald-500 text-emerald-600' },
                { id: 'HALF_DAY', label: 'Half Day', color: 'border-purple-500 text-purple-600' },
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setType(st.id);
                    setShowOverrideWarning(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between font-semibold transition-all ${
                    type === st.id
                      ? `bg-primary/10 border-primary text-foreground shadow-2xs font-extrabold ring-1 ring-primary`
                      : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <span className="text-[11px] block">{st.label}</span>
                  {type === st.id && <span className="text-[10px] text-primary mt-1 font-bold">Selected ✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Selection Dropdown (if SHIFT) */}
          {type === 'SHIFT' && (
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Assigned Working Shift Profile *</label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-medium text-foreground focus:outline-none"
                required
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Leave Type Input (if LEAVE) */}
          {type === 'LEAVE' && (
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Leave Category / Reason</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-medium text-foreground focus:outline-none"
              >
                <option value="SICK LEAVE">Sick Leave</option>
                <option value="CASUAL LEAVE">Casual Leave</option>
                <option value="EARNED LEAVE">Earned Leave</option>
                <option value="UNPAID LEAVE">Unpaid Leave</option>
                <option value="MATERNITY LEAVE">Maternity Leave</option>
                <option value="COMP OFF">Compensatory Off</option>
              </select>
            </div>
          )}

          {/* Override Section if Warning Triggered */}
          {(showOverrideWarning || isOverridden) && (
            <div className="p-3 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs space-y-2">
              <span className="font-bold text-rose-700 dark:text-rose-400 block">
                Manager Override Confirmation Required
              </span>
              <p className="text-[11px] text-muted-foreground">
                You are overriding an existing approved leave or holiday. Please provide a mandatory reason for the audit log.
              </p>
              <Input
                placeholder="Reason for overriding leave/holiday..."
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value);
                  setIsOverridden(true);
                }}
                className="text-xs h-9 bg-background"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Manager Notes / Instructions</label>
            <Input
              placeholder="e.g. On-call duty, special shift alignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            
            {cellData.hasApprovedLeave && type === 'SHIFT' && !isOverridden ? (
              <Button 
                type="button" 
                size="sm" 
                variant="destructive"
                onClick={() => {
                  setIsOverridden(true);
                  setShowOverrideWarning(true);
                }}
                className="font-bold gap-1 text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Override & Assign Shift
              </Button>
            ) : (
              <Button type="submit" size="sm" className="font-bold bg-primary text-primary-foreground">
                Save Schedule
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
