"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Edit2 } from "lucide-react";
import api from "@/lib/axios";
import { AddShiftModal } from "./AddShiftModal";
import { EditShiftModal } from "./EditShiftModal";

export function ShiftsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editShift, setEditShift] = useState<any>(null);
  const { data: shiftsRes, isLoading } = useQuery({
    queryKey: ["shiftsList"],
    queryFn: async () => (await api.get("/shifts")).data
  });

  const shifts = shiftsRes?.data || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 dark:text-slate-400 animate-pulse">Loading shift configurations...</div>;
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Shift
        </Button>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-slate-800">
            <TableRow>
              <TableHead>Shift Name</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Late Grace (mins)</TableHead>
              <TableHead>Half Day Grace (mins)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-32 text-center text-gray-500 dark:text-slate-400">No shifts configured.</TableCell></TableRow>
            ) : (
              shifts.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400"/> {s.name}
                  </TableCell>
                  <TableCell>{s.startTime}</TableCell>
                  <TableCell>{s.endTime}</TableCell>
                  <TableCell>{s.lateGracePeriodMinutes}m</TableCell>
                  <TableCell>{s.halfDayGracePeriodMinutes}m</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditShift(s); setIsEditModalOpen(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AddShiftModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditShiftModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} shift={editShift} />
    </div>
  );
}
