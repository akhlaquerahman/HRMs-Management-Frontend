"use client";

import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText, CheckCircle2, Clock, XCircle, MoreVertical, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const all = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.id]: true }), {});
      setSelectedRows(all);
    } else {
      setSelectedRows({});
    }
  };

  const handleBulkApprove = () => {
    const ids = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (ids.length === 0) return;
    if (window.confirm(`Are you sure you want to approve ${ids.length} selected leave requests?`)) {
      ids.forEach(id => onApprove?.(id));
      setSelectedRows({});
    }
  };

  const handleBulkReject = () => {
    const ids = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (ids.length === 0) return;
    if (window.confirm(`Are you sure you want to reject ${ids.length} selected leave requests?`)) {
      ids.forEach(id => onReject?.(id));
      setSelectedRows({});
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-12">
        <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading leave requests...</p>
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
      case 'CANCELLED': return <Badge className="bg-gray-100 dark:bg-slate-800 text-gray-700 hover:bg-gray-200 border-0">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil((data?.length || 0) / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Showing <span className="text-blue-600 font-bold">{data?.length || 0}</span> Leave Requests
        </h3>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold text-blue-700">{selectedCount} request(s) selected</span>
          <div className="flex items-center gap-2">
            {isHR ? (
              <>
                <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={handleBulkApprove}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="outline" size="sm" className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={handleBulkReject}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => alert(`Cancelling ${selectedCount} leave requests...`)}>
                <XCircle className="w-4 h-4 mr-1" /> Cancel Selected
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-3 w-10 pl-4">
                  <Checkbox 
                    checked={data?.length > 0 && data.every((d: any) => selectedRows[d.id])}
                    onCheckedChange={toggleSelectAll} 
                  />
                </th>
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
            {paginatedData.map((request: any, i: number) => {
              const isExpanded = expandedId === request.id;
              const days = differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1;
              const isPending = request.status === 'PENDING';

              return (
                <React.Fragment key={request.id}>
                  <tr className={cn("hover:bg-muted/20 transition-colors", isExpanded && "bg-muted/10")}>
                    <td className="px-4 py-3 pl-4" onClick={(e) => toggleSelect(request.id, e)}>
                      <Checkbox checked={!!selectedRows[request.id]} onCheckedChange={(c) => setSelectedRows(p => ({...p, [request.id]: !!c}))} />
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : request.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-xs">{request.employee?.employeeId || `#${request.id.slice(0,6)}`}</td>
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
                      <div className="flex items-center justify-end gap-2">
                        {isPending && isHR && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => onApprove?.(request.id)}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => onReject?.(request.id)}>
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {isPending && !isHR && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => onCancel?.(request.id)}>
                            Cancel
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                                {request.attachment.match(/\.(jpeg|jpg|gif|png)$/i) != null || request.attachment.startsWith('data:image') ? (
                                  <div className="mt-2 border rounded-md p-1 bg-white dark:bg-slate-900 inline-block shadow-sm">
                                     <img src={request.attachment} alt="Attachment" className="max-h-32 object-contain rounded" />
                                  </div>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 mt-1" 
                                    onClick={() => {
                                      if (request.attachment.startsWith('data:application/pdf')) {
                                        const link = document.createElement('a');
                                        link.href = request.attachment;
                                        link.download = `leave_attachment_${request.id}.pdf`;
                                        link.click();
                                      } else {
                                        window.open(request.attachment, '_blank');
                                      }
                                    }}
                                  >
                                    <FileText className="w-3 h-3 mr-2" /> Download Document
                                  </Button>
                                )}
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

      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-sm">
        <div className="flex items-center text-muted-foreground gap-2">
          <span>Show</span>
          <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[70px] h-8 bg-white dark:bg-slate-900">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map(size => (
                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-muted-foreground mx-2 text-xs font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}
