"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function AddHolidayModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("NATIONAL");

  const addMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post("/holidays", payload)).data,
    onSuccess: () => {
      toast.success("Holiday added successfully");
      queryClient.invalidateQueries({ queryKey: ["holidaysList"] });
      onClose();
      setName("");
      setDate("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to add holiday")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return toast.error("Name and Date are required");
    addMutation.mutate({ name, date, type });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Holiday</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Holiday Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Christmas" />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NATIONAL">National</SelectItem>
                <SelectItem value="COMPANY">Company</SelectItem>
                <SelectItem value="FESTIVAL">Festival</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add Holiday"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
