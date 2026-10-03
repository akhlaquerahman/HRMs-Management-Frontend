"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { 
  History, 
  Download, 
  Copy, 
  Eye, 
  FileText, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";

interface RosterHistoryItem {
  id: string;
  department: { id: string; name: string; code: string };
  designation?: { id: string; name: string };
  weekStart: string;
  weekEnd: string;
  status: string;
  version: number;
  createdById?: string;
  publishedById?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    entries: number;
    historyVersions: number;
    auditLogs: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  changedById?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export function RosterHistoryTab() {
  const [history, setHistory] = useState<RosterHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Audit modal
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roster/history');
      if (res.data?.success) {
        setHistory(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load roster history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openAuditLogs = async (rosterId: string) => {
    setSelectedRosterId(rosterId);
    setIsAuditModalOpen(true);
    try {
      setLoadingAudit(true);
      const res = await api.get(`/roster/audit-logs/${rosterId}`);
      if (res.data?.success) {
        setAuditLogs(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleExportHistoryXlsx = async (item: RosterHistoryItem) => {
    try {
      const response = await api.post('/roster/export-xlsx', {
        departmentId: item.department.id,
        designationId: item.designation?.id || 'ALL',
        weekStart: item.weekStart
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HRMS_Roster_${item.department.name}_${item.weekStart.slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to export roster XLSX');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-foreground">Roster History & Audit Trail</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchHistory}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh History
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 pl-5">Week Period</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Designation Scope</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Published</th>
                <th className="p-3.5">Total Entries</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading roster history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No historical rosters recorded yet. Create and save a weekly roster to get started.
                  </td>
                </tr>
              ) : (
                history.map(item => {
                  const weekStartFormatted = new Date(item.weekStart).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
                  const weekEndFormatted = new Date(item.weekEnd).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 pl-5 font-bold font-mono text-foreground">
                        {weekStartFormatted} – {weekEndFormatted}
                      </td>

                      <td className="p-3.5 font-semibold text-foreground">
                        {item.department.name}
                      </td>

                      <td className="p-3.5 text-muted-foreground">
                        {item.designation?.name || 'All Designations'}
                      </td>

                      <td className="p-3.5">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono font-bold text-[10px]">
                          v{item.version}
                        </Badge>
                      </td>

                      <td className="p-3.5">
                        <Badge className={`text-[10px] font-bold ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : item.status === 'LOCKED'
                            ? 'bg-rose-500/15 text-rose-600 border-rose-500/20'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/20'
                        }`}>
                          {item.status}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-muted-foreground">
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Not published'}
                      </td>

                      <td className="p-3.5 font-mono text-foreground font-semibold">
                        {item._count?.entries || 0} scheduled
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleExportHistoryXlsx(item)}
                            className="h-8 gap-1 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            XLSX
                          </Button>

                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openAuditLogs(item.id)}
                            className="h-8 gap-1 text-xs font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            Audit Log ({item._count?.auditLogs || 0})
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT LOG MODAL */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Roster Audit Compliance Logs
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete historical record of schedule modifications, overrides, imports, and publication events.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar my-2 border rounded-xl p-3 bg-muted/10 space-y-2.5">
            {loadingAudit ? (
              <div className="p-8 text-center text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Fetching audit log entries...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No compliance audit events logged for this roster.
              </div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-3 rounded-lg border bg-card text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary font-mono text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>

                  {log.employee && (
                    <div className="font-semibold text-foreground">
                      Target Employee: {log.employee.firstName} {log.employee.lastName} ({log.employee.employeeId})
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded">
                    {log.oldValue && <div><span className="font-bold text-rose-500">Old Value:</span> {log.oldValue}</div>}
                    {log.newValue && <div><span className="font-bold text-emerald-500">New Value:</span> {log.newValue}</div>}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button size="sm" variant="outline" onClick={() => setIsAuditModalOpen(false)}>
              Close Audit Trail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
