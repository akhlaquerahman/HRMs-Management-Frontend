"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function EditShiftModal({ isOpen, onClose, shift }: { isOpen: boolean, onClose: () => void, shift: any }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lateGrace, setLateGrace] = useState("15");

  useEffect(() => {
    if (shift && isOpen) {
      setName(shift.name || "");
      setStartTime(shift.startTime || "");
      setEndTime(shift.endTime || "");
      setLateGrace(shift.lateGracePeriodMinutes?.toString() || "15");
    }
  }, [shift, isOpen]);

  const editMutation = useMutation({
    mutationFn: async (payload: any) => (await api.put(`/shifts/${shift.id}`, payload)).data,
    onSuccess: () => {
      toast.success("Shift updated successfully");
      queryClient.invalidateQueries({ queryKey: ["shiftsList"] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update shift")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) return toast.error("All fields are required");
    editMutation.mutate({ 
      name, 
      startTime, 
      endTime, 
      lateGracePeriodMinutes: parseInt(lateGrace)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Shift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Shift Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Night Shift" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Late Grace Period (mins)</Label>
            <Input type="number" value={lateGrace} onChange={e => setLateGrace(e.target.value)} required min="0" />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={editMutation.isPending}>{editMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
