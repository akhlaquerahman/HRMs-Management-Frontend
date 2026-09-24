"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, FilterX, RefreshCcw, CheckCircle, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function TeamAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedCorrection, setSelectedCorrection] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comments, setComments] = useState("");

  const { data: corrections, isLoading, isFetching } = useQuery({
    queryKey: ['team_corrections_pending'],
    queryFn: async () => (await api.get('/attendance/corrections/pending')).data.data
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string, comments: string }) => {
      const res = await api.put(`/attendance/corrections/${id}/approve`, { comments });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Correction request approved");
      queryClient.invalidateQueries({ queryKey: ['team_corrections_pending'] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to approve request");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string, comments: string }) => {
      const res = await api.put(`/attendance/corrections/${id}/reject`, { comments });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Correction request rejected");
      queryClient.invalidateQueries({ queryKey: ['team_corrections_pending'] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reject request");
    }
  });

  const handleOpen = (correction: any) => {
    setSelectedCorrection(correction);
    setComments("");
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedCorrection(null);
    setComments("");
  };

  const handleApprove = () => {
    if (!selectedCorrection) return;
    approveMutation.mutate({ id: selectedCorrection.id, comments });
  };

  const handleReject = () => {
    if (!selectedCorrection) return;
    if (!comments.trim()) {
      toast.error("Rejection comments are required");
      return;
    }
    rejectMutation.mutate({ id: selectedCorrection.id, comments });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
      <PageHeader 
        title="Team Attendance Corrections" 
        description="Review and approve attendance regularization requests from your team."
        showCreate={false}
      />

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden mt-4">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Pending Requests</h3>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['team_corrections_pending'] })}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Old Timing</TableHead>
                <TableHead>Requested Timing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading requests...</TableCell>
                </TableRow>
              ) : (corrections || []).map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">{req.employee?.firstName} {req.employee?.lastName}</div>
                    <div className="text-xs text-muted-foreground">{req.employee?.email}</div>
                  </TableCell>
                  <TableCell>{format(new Date(req.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.correctionType.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>In: {req.currentCheckIn ? format(new Date(req.currentCheckIn), 'hh:mm a') : '--'}</div>
                    <div>Out: {req.currentCheckOut ? format(new Date(req.currentCheckOut), 'hh:mm a') : '--'}</div>
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    <div>In: {req.requestedCheckIn ? format(new Date(req.requestedCheckIn), 'hh:mm a') : '--'}</div>
                    <div>Out: {req.requestedCheckOut ? format(new Date(req.requestedCheckOut), 'hh:mm a') : '--'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="default" size="sm" onClick={() => handleOpen(req)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!corrections || corrections.length === 0) && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No pending correction requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Correction Request</DialogTitle>
            <DialogDescription>
              Review the attendance discrepancy and approve or reject the request.
            </DialogDescription>
          </DialogHeader>

          {selectedCorrection && (
            <div className="space-y-6 mt-2">
              <div className="bg-muted/30 p-4 rounded-lg border flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{selectedCorrection.employee?.firstName} {selectedCorrection.employee?.lastName}</div>
                  <div className="text-xs text-muted-foreground">{selectedCorrection.employee?.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{format(new Date(selectedCorrection.date), 'dd MMMM yyyy')}</div>
                  <Badge variant="outline" className="mt-1">{selectedCorrection.correctionType.replace(/_/g, ' ')}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-background">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Original Timeline</div>
                  <div className="text-sm">In: <span className="font-medium">{selectedCorrection.currentCheckIn ? format(new Date(selectedCorrection.currentCheckIn), 'hh:mm a') : 'Missing'}</span></div>
                  <div className="text-sm mt-1">Out: <span className="font-medium">{selectedCorrection.currentCheckOut ? format(new Date(selectedCorrection.currentCheckOut), 'hh:mm a') : 'Missing'}</span></div>
                </div>
                <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                  <div className="text-xs text-primary uppercase tracking-wider mb-2 font-semibold">Requested Timeline</div>
                  <div className="text-sm">In: <span className="font-medium">{selectedCorrection.requestedCheckIn ? format(new Date(selectedCorrection.requestedCheckIn), 'hh:mm a') : 'Missing'}</span></div>
                  <div className="text-sm mt-1">Out: <span className="font-medium">{selectedCorrection.requestedCheckOut ? format(new Date(selectedCorrection.requestedCheckOut), 'hh:mm a') : 'Missing'}</span></div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Employee Reason</h4>
                <div className="bg-muted/50 p-3 rounded-md text-sm text-foreground">
                  {selectedCorrection.reason}
                </div>
              </div>

              {selectedCorrection.attachmentUrl && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Attachment</h4>
                  <a href={selectedCorrection.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-2">
                    <Info className="w-4 h-4" /> View Supporting Document
                  </a>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Manager Comments</h4>
                <Textarea 
                  placeholder="Optional for approval, required for rejection..." 
                  value={comments} 
                  onChange={e => setComments(e.target.value)}
                  rows={2}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                <Button variant="outline" onClick={handleClose} disabled={approveMutation.isPending || rejectMutation.isPending}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleReject} isLoading={rejectMutation.isPending} disabled={approveMutation.isPending}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button onClick={handleApprove} isLoading={approveMutation.isPending} disabled={rejectMutation.isPending}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
