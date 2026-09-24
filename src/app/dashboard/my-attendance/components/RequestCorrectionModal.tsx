"use client";

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { X, UploadCloud, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '@/lib/axios';

const CORRECTION_TYPES = [
  { value: "MISSING_PUNCH_IN", label: "Missing Punch In" },
  { value: "MISSING_PUNCH_OUT", label: "Missing Punch Out" },
  { value: "WRONG_PUNCH", label: "Wrong Punch Time" },
  { value: "SYSTEM_ERROR", label: "System Error" },
  { value: "BIOMETRIC_FAILURE", label: "Biometric Failure" },
  { value: "LATE_PUNCH", label: "Late Punch" },
  { value: "OTHER", label: "Other" }
];

export function RequestCorrectionModal({
  isOpen,
  onClose,
  recordDate,
  currentIn,
  currentOut
}: {
  isOpen: boolean;
  onClose: () => void;
  recordDate?: Date;
  currentIn?: Date;
  currentOut?: Date;
}) {
  const queryClient = useQueryClient();
  const [correctionType, setCorrectionType] = useState("");
  const [requestedCheckIn, setRequestedCheckIn] = useState("");
  const [requestedCheckOut, setRequestedCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // In a real app with file uploads to ImageKit, you'd upload the file first, get the URL, then submit.
      // For now, we mock the attachmentUrl.
      const payload = {
        date: recordDate,
        correctionType,
        requestedCheckIn: requestedCheckIn ? new Date(`${format(recordDate!, 'yyyy-MM-dd')}T${requestedCheckIn}`) : null,
        requestedCheckOut: requestedCheckOut ? new Date(`${format(recordDate!, 'yyyy-MM-dd')}T${requestedCheckOut}`) : null,
        reason,
        attachmentUrl: attachment ? "mock-url" : null,
      };
      const res = await api.post('/attendance/corrections', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Correction request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ['my_corrections'] });
      queryClient.invalidateQueries({ queryKey: ['my_attendance'] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    }
  });

  const handleClose = () => {
    setCorrectionType("");
    setRequestedCheckIn("");
    setRequestedCheckOut("");
    setReason("");
    setAttachment(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionType || !reason) {
      toast.error("Please fill all required fields");
      return;
    }
    mutation.mutate({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Request Attendance Correction</DialogTitle>
          <DialogDescription>
            Submit a request to your manager to correct your attendance logs for {recordDate ? format(recordDate, 'dd MMM yyyy') : 'this date'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Current Punch In</Label>
              <div className="font-medium mt-1">{currentIn ? format(currentIn, 'hh:mm a') : '--:--'}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Current Punch Out</Label>
              <div className="font-medium mt-1">{currentOut ? format(currentOut, 'hh:mm a') : '--:--'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-1">
              <Label>Correction Type <span className="text-destructive">*</span></Label>
              <Select value={correctionType} onValueChange={setCorrectionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CORRECTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>Requested Punch In</Label>
              <Input
                type="time"
                value={requestedCheckIn}
                onChange={e => setRequestedCheckIn(e.target.value)}
                disabled={correctionType === "MISSING_PUNCH_OUT"}
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Requested Punch Out</Label>
              <Input
                type="time"
                value={requestedCheckOut}
                onChange={e => setRequestedCheckOut(e.target.value)}
                disabled={correctionType === "MISSING_PUNCH_IN"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Explain why you are requesting this correction..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Attachment (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg h-[120px] flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-colors">
                <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                <div className="text-sm font-medium">Click or drag file</div>
                <div className="text-xs text-muted-foreground mt-1">PDF, JPG (max. 5MB)</div>
                <Input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                />
                <Label htmlFor="file-upload" className="mt-2 cursor-pointer">
                  <Button variant="outline" size="sm" type="button" className="pointer-events-none h-8 text-xs">Browse</Button>
                </Label>
                {attachment && <div className="mt-1 text-xs text-green-600 truncate max-w-[200px]">Selected: {attachment.name}</div>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Submit Request</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
