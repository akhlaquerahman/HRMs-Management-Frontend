"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: number;
}

export interface GeolocationCaptureResult {
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  timestamp: number | null;
  error?: string | null;
}

const MIN_SAMPLE_INTERVAL_MS = 15000; // 15 seconds
const MIN_DISTANCE_METERS = 10; // 10 meters

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Capture high-accuracy current GPS location for attendance punch-in / punch-out
 */
export async function captureCurrentGPSLocation(): Promise<GeolocationCaptureResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      timestamp: null,
      error: 'Browser does not support Geolocation API'
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy * 10) / 10,
          timestamp: pos.timestamp,
          error: null
        });
      },
      (err) => {
        let errorMsg = 'Failed to obtain GPS location';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'GPS location permission was denied in your browser settings';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS satellite position is temporarily unavailable';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'GPS acquisition timed out. Please verify device location is on';
        }
        resolve({
          latitude: null,
          longitude: null,
          accuracyMeters: null,
          timestamp: null,
          error: errorMsg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Hook for managing live consented location tracking
 */
export function useLiveLocationTracking(isPunchedIn: boolean, initialConsent: boolean = false) {
  const [isConsented, setIsConsented] = useState<boolean>(initialConsent);
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(false);
  const [lastLocation, setLastLocation] = useState<LocationCoordinates | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  const [geofenceStatus, setGeofenceStatus] = useState<string>('UNKNOWN');
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');

  const watchIdRef = useRef<number | null>(null);
  const lastSampleRef = useRef<{ lat: number; lon: number; time: number } | null>(null);

  // Check browser permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          setPermissionState(permissionStatus.state as any);
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state as any);
          };
        })
        .catch(() => {});
    }
  }, []);

  // Send live update to backend
  const transmitLiveLocation = useCallback(async (coords: LocationCoordinates) => {
    try {
      const res = await api.post('/workforce/live-location', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracyMeters,
        timestamp: coords.timestamp
      });

      if (res.data?.success && res.data?.data) {
        setGeofenceStatus(res.data.data.geofenceStatus);
        setDistanceMeters(res.data.data.distanceMeters);
        setLastUpdatedTime(new Date());
      }
    } catch (err: any) {
      // Do not spam toasts on network glitch during background tracking
      console.warn('Live location sample transmission error:', err?.message);
    }
  }, []);

  // Manage watchPosition
  useEffect(() => {
    const shouldTrack = isPunchedIn && isConsented && typeof window !== 'undefined' && 'geolocation' in navigator;

    if (!shouldTrack) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTrackingActive(false);
      return;
    }

    setIsTrackingActive(true);

    const onPositionSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      const now = Date.now();

      const currentCoords: LocationCoordinates = {
        latitude: lat,
        longitude: lon,
        accuracyMeters: Math.round(accuracy * 10) / 10,
        timestamp: pos.timestamp || now
      };

      setLastLocation(currentCoords);

      // Throttling logic
      if (lastSampleRef.current) {
        const msElapsed = now - lastSampleRef.current.time;
        const distMoved = calculateDistance(lastSampleRef.current.lat, lastSampleRef.current.lon, lat, lon);

        if (msElapsed < MIN_SAMPLE_INTERVAL_MS && distMoved < MIN_DISTANCE_METERS) {
          // Suppress duplicate update within threshold
          return;
        }
      }

      lastSampleRef.current = { lat, lon, time: now };
      transmitLiveLocation(currentCoords);
    };

    const onPositionError = (err: GeolocationPositionError) => {
      console.warn('Geolocation watch error:', err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setPermissionState('denied');
        setIsTrackingActive(false);
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onPositionSuccess,
      onPositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isPunchedIn, isConsented, transmitLiveLocation]);

  // Grant tracking consent
  const grantConsent = async (policyVersion: string = '1.0') => {
    try {
      await api.post('/workforce/consent', { consented: true, policyVersion });
      setIsConsented(true);
      toast.success('Live location sharing enabled for this active work session');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update tracking consent');
    }
  };

  // Revoke tracking consent
  const revokeConsent = async () => {
    try {
      await api.post('/workforce/consent', { consented: false });
      setIsConsented(false);
      setIsTrackingActive(false);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      toast.info('Live location sharing paused');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to pause tracking consent');
    }
  };

  return {
    isConsented,
    isTrackingActive,
    lastLocation,
    lastUpdatedTime,
    geofenceStatus,
    distanceMeters,
    permissionState,
    grantConsent,
    revokeConsent
  };
}
