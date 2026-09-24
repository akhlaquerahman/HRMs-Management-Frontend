"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from '@/lib/dateUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";
import api from "@/lib/axios";
import { AddHolidayModal } from "./AddHolidayModal";

export function HolidaysTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: holidaysRes, isLoading } = useQuery({
    queryKey: ["holidaysList"],
    queryFn: async () => (await api.get("/holidays")).data
  });

  const holidays = holidaysRes?.data || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 dark:text-slate-400 animate-pulse">Loading holiday calendar...</div>;
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Holiday
        </Button>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-slate-800">
            <TableRow>
              <TableHead>Holiday Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-32 text-center text-gray-500 dark:text-slate-400">No upcoming holidays configured.</TableCell></TableRow>
            ) : (
              holidays.map((h: any) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400"/> {h.name}
                  </TableCell>
                  <TableCell>{formatDate(h.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={h.type === 'NATIONAL' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 dark:bg-slate-800 text-gray-700'}>
                      {h.type || 'Standard'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AddHolidayModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
