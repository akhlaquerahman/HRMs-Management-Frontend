"use client";

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getSocket, joinUserRooms } from '@/lib/socket';

export interface RealtimeShiftEvent {
  eventType: 'ROSTER_PUBLISHED' | 'ROSTER_UPDATED' | 'SHIFT_ALLOTTED' | 'ROSTER_COPIED';
  departmentId?: string;
  employeeIds?: string[];
  rosterId?: string;
  weekStart?: string;
  title: string;
  message: string;
  updatedBy?: string;
  timestamp: string;
}

export function useShiftSocket({
  userId,
  employeeId,
  departmentId,
  onShiftUpdate
}: {
  userId?: string;
  employeeId?: string;
  departmentId?: string;
  onShiftUpdate?: (event: RealtimeShiftEvent) => void;
}) {
  const queryClient = useQueryClient();
  const [lastEvent, setLastEvent] = useState<RealtimeShiftEvent | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsLiveConnected(true);
      joinUserRooms({ userId, employeeId, departmentId });
    };

    const handleDisconnect = () => {
      setIsLiveConnected(false);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    const handleShiftUpdate = (data: RealtimeShiftEvent) => {
      console.log('⚡ [Real-Time Shift Sync] Event received:', data);
      setLastEvent(data);

      // Invalidate relevant React Query caches to trigger immediate re-fetch
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      queryClient.invalidateQueries({ queryKey: ['employee_roster'] });
      queryClient.invalidateQueries({ queryKey: ['my_attendance'] });

      // Enterprise Toast Notification
      toast.success(
        (t) => (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {data.title || '⚡ Real-Time Shift Update'}
            </span>
            <span className="text-xs text-slate-700 dark:text-slate-300">
              {data.message || 'Your HR manager updated your shift schedule.'}
            </span>
          </div>
        ),
        { duration: 6000 }
      );

      if (onShiftUpdate) {
        onShiftUpdate(data);
      }
    };

    socket.on('shift:realtime_update', handleShiftUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('shift:realtime_update', handleShiftUpdate);
    };
  }, [userId, employeeId, departmentId, queryClient, onShiftUpdate]);

  return {
    isLiveConnected,
    lastEvent
  };
}
