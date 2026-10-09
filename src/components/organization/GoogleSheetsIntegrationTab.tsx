"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Loader2,
  Zap,
  Play,
  RotateCcw,
  Users,
  Clock,
  CalendarCheck,
  CalendarDays,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";

export function GoogleSheetsIntegrationTab() {
  const queryClient = useQueryClient();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [customSheetId, setCustomSheetId] = useState("");
  const [isEditingSheetId, setIsEditingSheetId] = useState(false);

  // Fetch status
  const { data: statusRes, isLoading, refetch } = useQuery({
    queryKey: ["googleSheetsStatus"],
    queryFn: async () => (await api.get("/google-sheets/status")).data.data,
    refetchInterval: 15000,
  });

  const data = statusRes || null;

  // Mutations
  const testConnMutation = useMutation({
    mutationFn: async () => (await api.post("/google-sheets/test-connection")).data,
    onSuccess: (res) => {
      toast.success(res.message || "Successfully connected to Google Spreadsheet!");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Connection test failed.");
    },
  });

  const initMutation = useMutation({
    mutationFn: async () => (await api.post("/google-sheets/initialize")).data,
    onSuccess: (res) => {
      toast.success(res.message || "Worksheets initialized successfully.");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to initialize worksheets.");
    },
  });

  const syncNowMutation = useMutation({
    mutationFn: async () => (await api.post("/google-sheets/sync-now")).data,
    onSuccess: (res) => {
      toast.success(res.message || "Full synchronization completed successfully!");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Synchronization failed.");
    },
  });

  const retryMutation = useMutation({
    mutationFn: async () => (await api.post("/google-sheets/retry-failed")).data,
    onSuccess: (res) => {
      toast.success(res.message || "Retry process completed.");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Retry failed.");
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (sheetId: string) => (await api.post("/google-sheets/config", { spreadsheetId: sheetId })).data,
    onSuccess: () => {
      toast.success("Spreadsheet ID updated successfully.");
      setIsEditingSheetId(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update spreadsheet configuration.");
    },
  });

  const handleCopyEmail = () => {
    if (data?.serviceAccountEmail) {
      navigator.clipboard.writeText(data.serviceAccountEmail);
      setCopiedEmail(true);
      toast.success("Service Account Email copied to clipboard");
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleSaveSheetId = () => {
    if (!customSheetId.trim()) {
      toast.error("Please enter a valid Google Spreadsheet ID");
      return;
    }
    updateConfigMutation.mutate(customSheetId.trim());
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Loading Google Sheets Integration status...</span>
      </div>
    );
  }

  const isConnected = data?.connectionStatus === "CONNECTED";
  const isNotConfigured = data?.connectionStatus === "NOT_CONFIGURED";

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border shadow-sm bg-gradient-to-r from-emerald-500/5 via-background to-blue-500/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Google Sheets Live Data Integration
                  {isConnected ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      CONNECTED
                    </Badge>
                  ) : isNotConfigured ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs">
                      NOT CONFIGURED
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-xs">
                      CONNECTION ERROR
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Automatically synchronize HRMS workforce, attendance, leave, and shift roster records with Google Spreadsheet.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="h-9 text-xs gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Status
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnMutation.mutate()}
                disabled={testConnMutation.isPending}
                className="h-9 text-xs gap-1.5"
              >
                {testConnMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                Test Connection
              </Button>

              <Button
                size="sm"
                onClick={() => syncNowMutation.mutate()}
                disabled={syncNowMutation.isPending || !isConnected}
                className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {syncNowMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Sync Now
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Service Account sharing banner */}
          <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur-sm space-y-2">
            <div className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Google Service Account Email (Add as Editor in your Google Sheet):</span>
              <Button variant="ghost" size="sm" onClick={handleCopyEmail} className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700">
                {copiedEmail ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedEmail ? "Copied" : "Copy Email"}
              </Button>
            </div>
            <code className="block p-2 rounded bg-muted/80 text-xs font-mono text-emerald-600 dark:text-emerald-400 select-all overflow-x-auto">
              {data?.serviceAccountEmail || "hrms-sheet@hrms-management-500604.iam.gserviceaccount.com"}
            </code>
          </div>

          {/* Spreadsheet URL & ID Config */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-card">
            <div className="space-y-1 flex-1 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground block">Target Google Spreadsheet:</span>
              {isEditingSheetId ? (
                <div className="flex items-center gap-2 max-w-md">
                  <Input
                    value={customSheetId}
                    onChange={(e) => setCustomSheetId(e.target.value)}
                    placeholder="Enter Google Spreadsheet ID..."
                    className="h-8 text-xs font-mono"
                  />
                  <Button size="sm" className="h-8 text-xs px-3" onClick={handleSaveSheetId} disabled={updateConfigMutation.isPending}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => setIsEditingSheetId(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs font-mono font-semibold text-foreground truncate">
                    {data?.spreadsheetId || "Not configured"}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-primary" onClick={() => { setCustomSheetId(data?.spreadsheetId || ""); setIsEditingSheetId(true); }}>
                    Change ID
                  </Button>
                </div>
              )}
            </div>

            {data?.spreadsheetUrl && (
              <a
                href={data.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Live Google Sheet
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Callout if any */}
      {data?.lastSyncError && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-start gap-3 animate-in fade-in">
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold block">Last Synchronization Error:</span>
            <p className="font-mono">{data.lastSyncError}</p>
          </div>
        </div>
      )}

      {/* Synchronized Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Employees Worksheet
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.counts?.employees ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Exported workforce records</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attendance Worksheet
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.counts?.attendance ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Punch logs & sessions</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Leave Requests
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.counts?.leaveRequests ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Leave applications & status</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shift Roster
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.counts?.shiftRoster ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Weekly shift assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Setup Commands */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Sheet Maintenance Actions
          </CardTitle>
          <CardDescription className="text-xs">
            Manage worksheet schemas, retry queued outbox updates, or re-initialize header structures.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => initMutation.mutate()}
            disabled={initMutation.isPending}
            className="text-xs gap-1.5"
          >
            {initMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />}
            Initialize Worksheets & Schema
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="text-xs gap-1.5"
          >
            {retryMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />}
            Retry Failed Jobs ({data?.failedJobCount ?? 0})
          </Button>
        </CardContent>
      </Card>

      {/* Recent Sync Audit Jobs Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Synchronization Audit Logs</CardTitle>
          <CardDescription className="text-xs">
            History of automated background syncs, manual triggers, and outbox reconciliations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">Worksheet</TableHead>
                <TableHead className="font-semibold">Trigger</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Inserted</TableHead>
                <TableHead className="font-semibold">Updated</TableHead>
                <TableHead className="font-semibold">Failed</TableHead>
                <TableHead className="font-semibold">Time</TableHead>
                <TableHead className="font-semibold text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data?.recentJobs || data.recentJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground font-medium">
                    No synchronization job logs recorded yet. Click "Sync Now" to run an initial synchronization.
                  </TableCell>
                </TableRow>
              ) : (
                data.recentJobs.map((job: any) => (
                  <TableRow key={job.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">{job.worksheet}</TableCell>
                    <TableCell className="text-muted-foreground">{job.triggerType}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          job.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                            : job.status === "PARTIAL_SUCCESS"
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                        }
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-emerald-600 font-semibold">{job.insertedCount}</TableCell>
                    <TableCell className="text-blue-600 font-semibold">{job.updatedCount}</TableCell>
                    <TableCell className={job.failedCount > 0 ? "text-rose-600 font-semibold" : "text-muted-foreground"}>
                      {job.failedCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(job.createdAt)}
                    </TableCell>
                    <TableCell className="text-right max-w-[200px] truncate text-muted-foreground font-mono">
                      {job.errorMessage || "Clean execution"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
