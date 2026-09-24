"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function AnalyticsTab() {
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ["attendanceOpsAnalytics"],
    queryFn: async () => (await api.get("/attendance/operations/analytics")).data
  });

  const trendData = analyticsRes?.data?.trend || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 dark:text-slate-400 animate-pulse">Loading analytics...</div>;
  }

  return (
    <div className="mt-6 space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Trend (Last 7 Days)</CardTitle>
            <CardDescription>Daily present vs absent comparison</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No trend data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Currently active workforce by department</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-gray-400">
            Advanced department analytics coming soon.
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
