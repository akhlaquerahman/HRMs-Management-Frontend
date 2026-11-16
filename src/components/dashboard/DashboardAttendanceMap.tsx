"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface PresentEmployeeLocation {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  department: string;
  designation: string;
  attendanceStatus: string;
  isCurrentlyPunchedIn: boolean;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  punchInCoordinates?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    capturedAt?: string | null;
  } | null;
  activeLocation?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    lastUpdatedAt?: string | null;
    source?: string;
  } | null;
  geofenceStatus: string;
  distanceMeters?: number | null;
  isLiveTracking: boolean;
  trackingConsentStatus: string;
  markerColor: 'green' | 'orange' | 'blue' | 'grey' | 'red';
  markerLabel: string;
}

export interface DashboardOfficeLocation {
  id: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

interface DashboardAttendanceMapProps {
  employees: PresentEmployeeLocation[];
  offices: DashboardOfficeLocation[];
  selectedEmployee: PresentEmployeeLocation | null;
  onSelectEmployee: (emp: PresentEmployeeLocation) => void;
  heightClass?: string;
}

// Custom DivIcon for Employee Marker
function createEmployeeDivIcon(emp: PresentEmployeeLocation, isSelected: boolean) {
  const colorMap = {
    green: { bg: '#10b981', badgeBg: '#d1fae5', badgeText: '#065f46' },
    orange: { bg: '#f59e0b', badgeBg: '#fef3c7', badgeText: '#92400e' },
    blue: { bg: '#3b82f6', badgeBg: '#dbeafe', badgeText: '#1e40af' },
    grey: { bg: '#6b7280', badgeBg: '#f3f4f6', badgeText: '#374151' },
    red: { bg: '#ef4444', badgeBg: '#fee2e2', badgeText: '#991b1b' },
  };

  const scheme = colorMap[emp.markerColor] || colorMap.green;
  const initials = `${emp.firstName.charAt(0)}${emp.lastName ? emp.lastName.charAt(0) : ''}`.toUpperCase();
  const selectedStyle = isSelected
    ? 'border: 3px solid #1e293b; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6); transform: scale(1.1);'
    : 'border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);';

  const pulseRing = emp.isLiveTracking
    ? `<span style="position: absolute; top: -4px; right: -4px; display: flex; height: 14px; width: 14px;">
         <span style="animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite; position: absolute; height: 100%; width: 100%; border-radius: 9999px; background-color: #60a5fa; opacity: 0.75;"></span>
         <span style="position: relative; border-radius: 9999px; height: 14px; width: 14px; background-color: #2563eb; border: 2px solid white;"></span>
       </span>`
    : '';

  const avatar = emp.photo
    ? `<img src="${emp.photo}" alt="${emp.firstName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 9999px;" />`
    : `<span style="font-weight: 700; font-size: 11px; color: white;">${initials}</span>`;

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
      <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background-color: ${scheme.bg}; display: flex; align-items: center; justify-content: center; ${selectedStyle}">
        ${avatar}
        ${pulseRing}
      </div>
      <div style="margin-top: 3px; padding: 2px 6px; border-radius: 6px; background-color: ${scheme.badgeBg}; color: ${scheme.badgeText}; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.08); max-width: 120px; overflow: hidden; text-overflow: ellipsis;">
        ${emp.firstName} ${emp.lastName ? emp.lastName.charAt(0) + '.' : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-emp-marker',
    iconSize: [120, 60],
    iconAnchor: [60, 36],
    popupAnchor: [0, -38]
  });
}

// Office DivIcon
function createOfficeDivIcon(office: DashboardOfficeLocation) {
  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="width: 38px; height: 38px; border-radius: 10px; background-color: #0f172a; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 2px solid #38bdf8;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
          <path d="M10 6h4"/>
          <path d="M10 10h4"/>
          <path d="M10 14h4"/>
          <path d="M10 18h4"/>
        </svg>
      </div>
      <div style="margin-top: 3px; padding: 2px 7px; border-radius: 5px; background-color: #0f172a; color: #38bdf8; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25); border: 1px solid #38bdf8;">
        🏢 ${office.name} (${Math.round(office.radiusMeters)}m)
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-office-pin',
    iconSize: [140, 62],
    iconAnchor: [70, 38],
    popupAnchor: [0, -40]
  });
}

function createPopupContent(emp: PresentEmployeeLocation, lat: number, lon: number): string {
  const punchInTimeFormatted = emp.punchInTime
    ? new Date(emp.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : 'Punched In';

  const isInside = emp.geofenceStatus === 'INSIDE_OFFICE';
  const statusColor = isInside ? '#059669' : '#d97706';
  const statusText = isInside ? 'Inside Office' : 'Outside Office (Remote)';
  const distText = emp.distanceMeters !== null && emp.distanceMeters !== undefined
    ? (emp.distanceMeters >= 1000 ? `${(emp.distanceMeters / 1000).toFixed(1)} km` : `${Math.round(emp.distanceMeters)} m`)
    : null;

  return `
    <div style="padding: 6px; min-width: 210px; max-width: 260px; font-family: inherit; font-size: 11px; line-height: 1.4;">
      <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; shrink: 0;">
          ${emp.photo ? `<img src="${emp.photo}" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover;" />` : `${emp.firstName.charAt(0)}${emp.lastName ? emp.lastName.charAt(0) : ''}`}
        </div>
        <div style="overflow: hidden;">
          <div style="font-weight: 700; color: #0f172a; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${emp.firstName} ${emp.lastName}
          </div>
          <div style="color: #64748b; font-size: 10px;">
            ${emp.employeeId} • ${emp.department}
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #64748b;">Punch Time:</span>
        <strong style="color: #0f172a;">${punchInTimeFormatted}</strong>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #64748b;">Geofence:</span>
        <strong style="color: ${statusColor};">${statusText}</strong>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #64748b;">GPS Coordinates:</span>
        <span style="font-family: monospace; font-size: 10px; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-weight: 600;">
          ${lat.toFixed(5)}°, ${lon.toFixed(5)}°
        </span>
      </div>

      ${distText ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #64748b;">Office Distance:</span>
        <span style="color: #0f172a; font-weight: 600;">${distText}</span>
      </div>` : ''}

      ${emp.punchInCoordinates?.accuracyMeters ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #64748b;">GPS Accuracy:</span>
        <span style="color: #64748b;">±${Math.round(emp.punchInCoordinates.accuracyMeters)}m</span>
      </div>` : ''}

      ${emp.isLiveTracking ? `
      <div style="margin-top: 4px; padding: 2px 4px; background: #eff6ff; color: #2563eb; border-radius: 4px; font-weight: 600; font-size: 10px; display: flex; align-items: center; gap: 4px;">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #2563eb;"></span>
        Live GPS Location Sharing Active
      </div>` : ''}

      <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; padding: 4px 8px; background: #0f172a; color: white; border-radius: 4px; text-decoration: none; font-size: 10px; font-weight: 600;">
          Open in Google Maps / Directions →
        </a>
      </div>
    </div>
  `;
}

export default function DashboardAttendanceMap({
  employees,
  offices,
  selectedEmployee,
  onSelectEmployee,
  heightClass = "h-[420px]"
}: DashboardAttendanceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Determine initial center
  const firstEmpWithCoords = employees.find(
    e => (e.activeLocation?.latitude && e.activeLocation?.longitude) ||
         (e.punchInCoordinates?.latitude && e.punchInCoordinates?.longitude)
  );

  const defaultCenter: [number, number] = offices.length > 0
    ? [offices[0].latitude, offices[0].longitude]
    : firstEmpWithCoords
      ? [
          (firstEmpWithCoords.activeLocation?.latitude || firstEmpWithCoords.punchInCoordinates?.latitude)!,
          (firstEmpWithCoords.activeLocation?.longitude || firstEmpWithCoords.punchInCoordinates?.longitude)!
        ]
      : [28.4983, 77.0898];

  // Initialize Map safely with full container cleanup (fixes "Map container is already initialized")
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Reset internal leaflet ID on DOM node to prevent StrictMode collision
    if ((containerRef.current as any)._leaflet_id) {
      (containerRef.current as any)._leaflet_id = null;
    }

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 14,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
    }).addTo(map);

    // Layer group for dynamic offices and markers
    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;

    // Invalidate size after layout settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      layersGroupRef.current = null;
      markersMapRef.current.clear();
      if (containerRef.current && (containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Sync Markers and Geofences whenever employees or offices change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();
    markersMapRef.current.clear();

    // 1. Render Office Geofences & Pins
    if (offices.length > 0 && offices[0]) {
      const primary = offices[0];
      const center = map.getCenter();
      if (Math.abs(center.lat - primary.latitude) > 0.002 || Math.abs(center.lng - primary.longitude) > 0.002) {
        map.panTo([primary.latitude, primary.longitude], { animate: true });
      }
    }

    offices.forEach((office) => {
      // Circle
      const circle = L.circle([office.latitude, office.longitude], {
        radius: office.radiusMeters,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.16,
        weight: 2,
        dashArray: '5, 5'
      });
      layersGroup.addLayer(circle);

      // Office Marker
      const officeMarker = L.marker([office.latitude, office.longitude], {
        icon: createOfficeDivIcon(office)
      });
      officeMarker.bindPopup(`
        <div style="padding: 4px; font-size: 11px;">
          <strong style="font-size: 12px; color: #0f172a;">🏢 ${office.name}</strong>
          ${office.address ? `<p style="margin: 2px 0; color: #64748b;">${office.address}</p>` : ''}
          <div style="color: #0284c7; font-weight: 600; margin-top: 4px;">
            Geofence Radius: ${Math.round(office.radiusMeters)} meters
          </div>
          <div style="color: #64748b; font-size: 10px; margin-top: 2px;">
            GPS: ${office.latitude.toFixed(5)}, ${office.longitude.toFixed(5)}
          </div>
        </div>
      `);
      layersGroup.addLayer(officeMarker);
    });

    // 2. Render Present Employees
    employees.forEach((emp) => {
      const lat = emp.activeLocation?.latitude || emp.punchInCoordinates?.latitude;
      const lon = emp.activeLocation?.longitude || emp.punchInCoordinates?.longitude;
      if (!lat || !lon) return;

      const isSelected = selectedEmployee?.id === emp.id;
      const marker = L.marker([lat, lon], {
        icon: createEmployeeDivIcon(emp, isSelected)
      });

      marker.bindPopup(createPopupContent(emp, lat, lon));

      marker.on('click', () => {
        onSelectEmployee(emp);
      });

      layersGroup.addLayer(marker);
      markersMapRef.current.set(emp.id, marker);
    });
  }, [employees, offices, onSelectEmployee]);

  // Handle selectedEmployee animation and popup opening
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedEmployee) return;

    const lat = selectedEmployee.activeLocation?.latitude || selectedEmployee.punchInCoordinates?.latitude;
    const lon = selectedEmployee.activeLocation?.longitude || selectedEmployee.punchInCoordinates?.longitude;
    if (!lat || !lon) return;

    map.flyTo([lat, lon], Math.max(map.getZoom(), 16), {
      duration: 1.2
    });

    const marker = markersMapRef.current.get(selectedEmployee.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 400);
    }
  }, [selectedEmployee]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClass} rounded-xl overflow-hidden border shadow-inner`}
      style={{ backgroundColor: '#f1f5f9' }}
    />
  );
}
