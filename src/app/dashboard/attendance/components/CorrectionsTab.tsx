"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from '@/lib/dateUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

export function CorrectionsTab() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);
  
  const { data: correctionsRes, isLoading } = useQuery({
    queryKey: ["pendingCorrectionsOps"],
    queryFn: async () => (await api.get("/attendance/corrections/pending")).data
  });

  const corrections = correctionsRes?.data || [];

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(id);
      setProcessingAction(action);
      await api.put(`/attendance/corrections/${id}/${action}`, { comments: `HR ${action}d` });
      toast.success(`Request ${action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ["pendingCorrectionsOps"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceOpsList"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceOpsSummary"] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 dark:text-slate-400 animate-pulse">Loading corrections queue...</div>;
  }

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden mt-6">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-slate-800">
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Correction Type</TableHead>
            <TableHead>Requested In/Out</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {corrections.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="h-32 text-center text-gray-500 dark:text-slate-400">No pending attendance corrections.</TableCell></TableRow>
          ) : (
            corrections.map((req: any) => (
              <TableRow key={req.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={req.employee?.photo || req.employee?.user?.profilePic} alt={req.employee?.firstName} />
                      <AvatarFallback>{req.employee?.firstName?.[0]}{req.employee?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-slate-100">{req.employee?.firstName} {req.employee?.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{req.employee?.employeeId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(req.date)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">{req.correctionType.replace(/_/g, ' ')}</Badge>
                </TableCell>
                <TableCell>
                  {req.requestedCheckIn ? new Date(req.requestedCheckIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'} 
                  {' - '}
                  {req.requestedCheckOut ? new Date(req.requestedCheckOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={req.reason}>{req.reason || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-200 hover:bg-red-50" 
                    onClick={() => handleAction(req.id, 'reject')}
                    disabled={processingId === req.id}
                  >
                    {processingId === req.id && processingAction === 'reject' ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-1"/>
                    )} 
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={() => handleAction(req.id, 'approve')}
                    disabled={processingId === req.id}
                  >
                    {processingId === req.id && processingAction === 'approve' ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1"/>
                    )} 
                    Approve
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
