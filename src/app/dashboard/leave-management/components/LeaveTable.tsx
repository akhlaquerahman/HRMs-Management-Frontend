"use client";

import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ChevronDown, ChevronUp, FileText, CheckCircle2, Clock, XCircle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LeaveHistoryTimeline } from './LeaveHistoryTimeline';

interface LeaveTableProps {
  data: any[];
  loading?: boolean;
  isHR?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function LeaveTable({ data, loading, isHR, onApprove, onReject, onCancel }: LeaveTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/20 border-b">
          <div className="h-6 bg-muted rounded w-1/4" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-muted/40 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Leave Requests Found</h3>
        <p className="text-sm text-muted-foreground">
          {isHR ? "There are no pending requests to review." : "Apply for your first leave request to see it here."}
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Approved</Badge>;
      case 'PENDING': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">Pending</Badge>;
      case 'REJECTED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0">Rejected</Badge>;
      case 'CANCELLED': return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-semibold sticky top-0">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">ID</th>
              {isHR && <th className="px-4 py-3">Employee</th>}
              <th className="px-4 py-3">Leave Type</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Applied On</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((request) => {
              const isExpanded = expandedId === request.id;
              const days = differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1;
              const isPending = request.status === 'PENDING';

              return (
                <React.Fragment key={request.id}>
                  <tr className={cn("hover:bg-muted/20 transition-colors", isExpanded && "bg-muted/10")}>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : request.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{request.id.slice(0,6)}</td>
                    {isHR && (
                      <td className="px-4 py-3 font-medium">
                        {request.employee?.firstName} {request.employee?.lastName}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{request.leaveType}</span>
                        {request.halfDay && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded w-max mt-0.5">Half Day</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(request.startDate), 'MMM dd')} - {format(new Date(request.endDate), 'MMM dd')}
                    </td>
                    <td className="px-4 py-3 font-medium">{days}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {isPending && isHR && (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => onApprove?.(request.id)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => onReject?.(request.id)}>
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                      {isPending && !isHR && (
                        <Button size="sm" variant="outline" className="h-8" onClick={() => onCancel?.(request.id)}>
                          Cancel
                        </Button>
                      )}
                      {!isPending && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row Content */}
                  {isExpanded && (
                    <tr className="bg-muted/5 border-b">
                      <td colSpan={isHR ? 9 : 8} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Left Col: Details */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Reason for Leave</h4>
                              <p className="text-sm bg-card p-3 rounded-lg border">{request.description || "No reason provided."}</p>
                            </div>

                            <div className="flex gap-4">
                              {request.workFromHome && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Work From Home</Badge>
                              )}
                              {request.emergencyLeave && (
                                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">Emergency Leave</Badge>
                              )}
                            </div>

                            {request.attachment && (
                              <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Attachments</h4>
                                <Button variant="outline" size="sm" className="h-8">
                                  <FileText className="w-3 h-3 mr-2" /> View Document
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Right Col: Timeline */}
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Approval Timeline</h4>
                            <LeaveHistoryTimeline history={request.approvalHistory} />
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
