"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useLiveLocationTracking } from '@/hooks/useLiveLocationTracking';
import { LocationConsentModal } from '../shared/LocationConsentModal';
import { MapPin, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function LiveTrackingIndicator() {
  const { user } = useAuthStore();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [now, setNow] = useState(Date.now());

  const role = typeof user?.role === 'string' ? user.role.toUpperCase().trim().replace(/\s+/g, '_') : '';
  const isSuperAdmin = role === 'SUPER_ADMIN' || user?.role === 'SUPER_ADMIN';

  // Tick every 30s to update "X min ago"
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: statusData } = useQuery({
    queryKey: ['attendance_status'],
    queryFn: async () => (await api.get('/attendance/status')).data.data,
    refetchInterval: 20000,
    enabled: !isSuperAdmin
  });

  const isPunchedIn = statusData?.currentState === 'PUNCHED_IN' || statusData?.currentState === 'ON_BREAK';
  const initialConsent = Boolean(statusData?.locationLatest?.isLiveTracking);

  const {
    isConsented,
    isTrackingActive,
    lastUpdatedTime,
    geofenceStatus,
    distanceMeters,
    grantConsent,
    revokeConsent
  } = useLiveLocationTracking(isPunchedIn, initialConsent);

  if (isSuperAdmin || !isPunchedIn) {
    return null;
  }

  const updatedAgoText = lastUpdatedTime
    ? formatDistanceToNow(lastUpdatedTime, { addSuffix: true })
    : 'Waiting for update';

  return (
    <>
      <div
        onClick={() => setShowConsentModal(true)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full cursor-pointer transition-all border text-xs select-none hover:shadow-xs bg-card"
        title="Click to view live tracking privacy notice & settings"
      >
        {isTrackingActive ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            <div className="flex flex-col text-left leading-none">
              <span className="font-bold text-[10px] sm:text-xs tracking-wider text-blue-600 uppercase flex items-center gap-1">
                LIVE LOCATION SHARING
              </span>
              <span className="text-[9px] text-muted-foreground hidden md:inline">
                {updatedAgoText}
              </span>
            </div>
          </>
        ) : (
          <>
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium text-[11px] hidden sm:inline">
              Location Sharing Inactive
            </span>
          </>
        )}
      </div>

      <LocationConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        isCurrentlyTracking={isTrackingActive}
        onAccept={grantConsent}
        onRevoke={revokeConsent}
      />
    </>
  );
}
