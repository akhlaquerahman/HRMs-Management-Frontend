"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { PresentEmployeeLocation, DashboardOfficeLocation } from './DashboardAttendanceMap';

interface Props {
  employees: PresentEmployeeLocation[];
  offices: DashboardOfficeLocation[];
  selectedEmployee: PresentEmployeeLocation | null;
  onSelectEmployee: (emp: PresentEmployeeLocation) => void;
  heightClass?: string;
}

export const DashboardAttendanceMapWrapper = dynamic<Props>(
  () => import('./DashboardAttendanceMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-xl border flex flex-col items-center justify-center bg-muted/20 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Loading OpenStreetMap & Punch-In Geodata...
        </span>
      </div>
    )
  }
);
