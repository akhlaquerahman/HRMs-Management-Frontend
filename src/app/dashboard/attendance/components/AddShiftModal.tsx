"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AddShiftModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lateGrace, setLateGrace] = useState("15");

  const addMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post("/shifts", payload)).data,
    onSuccess: () => {
      toast.success("Shift created successfully");
      queryClient.invalidateQueries({ queryKey: ["shiftsList"] });
      onClose();
      setName("");
      setStartTime("");
      setEndTime("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create shift")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) return toast.error("All fields are required");
    addMutation.mutate({ 
      name, 
      startTime, 
      endTime, 
      lateGracePeriodMinutes: parseInt(lateGrace),
      halfDayGracePeriodMinutes: 240
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create New Shift</DialogTitle>
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
            <Button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? "Creating..." : "Create Shift"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
