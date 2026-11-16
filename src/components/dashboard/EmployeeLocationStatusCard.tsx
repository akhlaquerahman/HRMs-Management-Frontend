"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useLiveLocationTracking } from '@/hooks/useLiveLocationTracking';
import { LocationConsentModal } from '../shared/LocationConsentModal';
import { 
  MapPin, 
  ShieldCheck, 
  Building, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  ExternalLink 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from 'date-fns';

export function EmployeeLocationStatusCard() {
  const { user } = useAuthStore();
  const [showConsentModal, setShowConsentModal] = useState(false);

  const role = typeof user?.role === 'string' ? user.role.toUpperCase().trim().replace(/\s+/g, '_') : '';
  const isSuperAdmin = role === 'SUPER_ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['attendance_status'],
    queryFn: async () => (await api.get('/attendance/status')).data.data,
    refetchInterval: 15000,
    enabled: !isSuperAdmin
  });

  const isPunchedIn = statusData?.currentState === 'PUNCHED_IN' || statusData?.currentState === 'ON_BREAK';
  const initialConsent = Boolean(statusData?.locationLatest?.isLiveTracking);
  const loc = statusData?.locationLatest;

  const {
    isConsented,
    isTrackingActive,
    lastLocation,
    lastUpdatedTime,
    geofenceStatus,
    distanceMeters,
    permissionState,
    grantConsent,
    revokeConsent
  } = useLiveLocationTracking(isPunchedIn, initialConsent);

  if (isSuperAdmin) {
    return null;
  }

  const effectiveGeofenceStatus = geofenceStatus !== 'UNKNOWN' ? geofenceStatus : (loc?.geofenceStatus || 'UNKNOWN');
  const effectiveDistance = distanceMeters !== null ? distanceMeters : loc?.distanceMeters;

  const formatDistance = (meters?: number | null) => {
    if (meters === undefined || meters === null || meters < 0) return null;
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km away`;
    return `${Math.round(meters)} meters away`;
  };

  return (
    <>
      <div className="bg-card rounded-xl border shadow-xs p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 border-b pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight">
                Workforce Location & Geofence
              </h3>
              <p className="text-xs text-muted-foreground">
                Verified attendance positioning & consent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isTrackingActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Live Sharing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border">
                Sharing Inactive
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          {/* Geofence Status */}
          <div className="p-3 bg-muted/30 rounded-lg border">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              Office Geofence Status
            </div>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              {effectiveGeofenceStatus === 'INSIDE_OFFICE' ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Inside Office Geofence
                </span>
              ) : effectiveGeofenceStatus === 'OUTSIDE_OFFICE' ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Outside Office {formatDistance(effectiveDistance) && `(${formatDistance(effectiveDistance)})`}
                </span>
              ) : effectiveGeofenceStatus === 'UNCERTAIN' ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> GPS Uncertain (Low Accuracy)
                </span>
              ) : (
                <span className="text-muted-foreground">Location Unavailable</span>
              )}
            </div>
          </div>

          {/* Punch-In Location */}
          <div className="p-3 bg-muted/30 rounded-lg border">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Punch-In GPS Capture
            </div>
            <div className="font-semibold text-foreground">
              {loc?.punchInLatitude && loc?.punchInLongitude ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Verified GPS ({loc.punchInAccuracyMeters ? `±${Math.round(loc.punchInAccuracyMeters)}m` : 'Captured'})
                </span>
              ) : loc?.punchInUnavailableReason ? (
                <span className="text-amber-600 text-xs">
                  {loc.punchInUnavailableReason}
                </span>
              ) : isPunchedIn ? (
                <span className="text-muted-foreground">Not captured</span>
              ) : (
                <span className="text-muted-foreground">Punch in to verify</span>
              )}
            </div>
          </div>

          {/* Location Permission */}
          <div className="p-3 bg-muted/30 rounded-lg border">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Browser GPS Permission
            </div>
            <div className="font-semibold capitalize text-foreground">
              {permissionState === 'granted' ? (
                <span className="text-emerald-600">Granted</span>
              ) : permissionState === 'denied' ? (
                <span className="text-destructive">Denied by Browser</span>
              ) : (
                <span className="text-muted-foreground">{permissionState}</span>
              )}
            </div>
          </div>

          {/* Last Update */}
          <div className="p-3 bg-muted/30 rounded-lg border">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" />
              Last Location Update
            </div>
            <div className="font-semibold text-foreground">
              {lastUpdatedTime ? (
                formatDistanceToNow(lastUpdatedTime, { addSuffix: true })
              ) : loc?.lastUpdatedAt ? (
                formatDistanceToNow(new Date(loc.lastUpdatedAt), { addSuffix: true })
              ) : (
                <span className="text-muted-foreground">No recent sample</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowConsentModal(true)}
            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy Notice & Live Sharing Controls
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </button>

          {isPunchedIn && (
            <Button
              size="sm"
              variant={isTrackingActive ? "outline" : "default"}
              className="h-8 text-xs font-semibold w-full sm:w-auto"
              onClick={() => {
                if (isTrackingActive) {
                  revokeConsent();
                } else {
                  grantConsent();
                }
              }}
            >
              {isTrackingActive ? "Pause Live Location" : "Enable Live Sharing"}
            </Button>
          )}
        </div>
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
