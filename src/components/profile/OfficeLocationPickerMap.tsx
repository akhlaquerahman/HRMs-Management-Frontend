"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OfficeLocationPickerMapProps {
  lat: number;
  lng: number;
  radiusMeters: number;
  onLocationChange: (lat: number, lng: number) => void;
  heightClass?: string;
}

export default function OfficeLocationPickerMap({
  lat,
  lng,
  radiusMeters,
  onLocationChange,
  heightClass = "h-[380px]"
}: OfficeLocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if ((containerRef.current as any)._leaflet_id) {
      (containerRef.current as any)._leaflet_id = null;
    }

    const initialCenter: [number, number] = [lat || 28.4983, lng || 77.0898];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 15,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Office Custom Icon
    const officeIcon = L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background-color: #0f172a; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid #38bdf8;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
              <path d="M10 6h4"/>
              <path d="M10 10h4"/>
              <path d="M10 14h4"/>
              <path d="M10 18h4"/>
            </svg>
          </div>
          <div style="margin-top: 3px; padding: 2px 8px; border-radius: 5px; background-color: #0f172a; color: #38bdf8; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25); border: 1px solid #38bdf8;">
            🏢 Drag or Click
          </div>
        </div>
      `,
      className: 'custom-office-picker-pin',
      iconSize: [140, 64],
      iconAnchor: [70, 40],
    });

    // Geofence Circle
    const circle = L.circle(initialCenter, {
      radius: radiusMeters || 150,
      color: '#0284c7',
      fillColor: '#38bdf8',
      fillOpacity: 0.18,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);
    circleRef.current = circle;

    // Draggable Marker
    const marker = L.marker(initialCenter, {
      icon: officeIcon,
      draggable: true
    }).addTo(map);
    markerRef.current = marker;

    // Drag End Event
    marker.on('dragend', (e: any) => {
      const position = e.target.getLatLng();
      circle.setLatLng(position);
      onLocationChange(position.lat, position.lng);
    });

    // Map Click Event: Move marker & circle to clicked point
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      circle.setLatLng([clickLat, clickLng]);
      onLocationChange(clickLat, clickLng);
    });

    // Invalidate size once container renders
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      circleRef.current = null;
      if (containerRef.current && (containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Update center & circle when lat/lng or radius change externally (e.g. from search or radius pills)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const currentPos = markerRef.current.getLatLng();
    if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
      const nextPos: [number, number] = [lat, lng];
      markerRef.current.setLatLng(nextPos);
      circleRef.current.setLatLng(nextPos);
      mapInstanceRef.current.panTo(nextPos, { animate: true });
    }
    circleRef.current.setRadius(radiusMeters || 150);
  }, [lat, lng, radiusMeters]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClass} rounded-xl overflow-hidden border shadow-inner`}
      style={{ backgroundColor: '#f8fafc' }}
    />
  );
}
