"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: resData, isLoading, isError } = useQuery({
    queryKey: ["audit_logs", page, limit],
    queryFn: async () => {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
      return res.data;
    }
  });

  const logs = resData?.data?.logs || [];
  const pagination = resData?.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <PageHeader
        title={t("System Audit Logs")}
        description={t("Review a chronological list of actions performed across the system.")}
        showCreate={false}
        showSearch={false}
        showFilters={false}
        showExport={false}
        showImport={false}
      />

      <div className="border rounded-xl bg-card shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">{t("Activity Log")}</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center p-8 text-destructive">
              {t("Failed to load audit logs. Are you sure you have permission?")}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {t("No audit logs found.")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">IP Address</th>
                    <th className="px-4 py-3 font-medium">Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log: any) => {
                    const dateStr = log.timestamp.endsWith('Z') ? log.timestamp : log.timestamp + 'Z';
                    return (
                      <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(dateStr).toLocaleString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-primary">
                          {log.action}
                        </td>
                        <td className="px-4 py-3">
                          {log.entity} <span className="text-xs text-muted-foreground">({log.entityId || "N/A"})</span>
                        </td>
                        <td className="px-4 py-3 max-w-[150px] truncate" title={log.userId}>
                          {log.user ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{log.user.firstName} {log.user.lastName}</span>
                              <span className="text-xs text-muted-foreground">{log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.ip || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]" title={log.browser || "Unknown"}>
                          {log.browser || "Unknown"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {logs.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                  <span>{t("Show")}</span>
                  <select 
                    value={limit} 
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="border rounded px-2 py-1 bg-background focus:ring focus:ring-primary/20"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>{t("entries")}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span>
                    {t("Page")} {pagination.page} {t("of")} {pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
