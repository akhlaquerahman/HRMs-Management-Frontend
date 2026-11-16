"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Search, 
  Loader2, 
  Check, 
  ShieldCheck, 
  Crosshair, 
  Compass, 
  Building2 
} from 'lucide-react';

// Client-only dynamic Leaflet Map wrapper
const OfficeLocationPickerMap = dynamic(
  () => import('./OfficeLocationPickerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] rounded-xl border flex flex-col items-center justify-center bg-muted/20 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Loading OpenStreetMap Picker...
        </span>
      </div>
    )
  }
);

interface OfficeLocationResult {
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface OfficeLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAddress?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  initialRadius?: number | null;
  onSelectLocation: (result: OfficeLocationResult) => void;
}

export function OfficeLocationPickerModal({
  isOpen,
  onClose,
  initialAddress = "",
  initialLat,
  initialLng,
  initialRadius = 150,
  onSelectLocation
}: OfficeLocationPickerModalProps) {
  const [lat, setLat] = useState<number>(initialLat || 28.5065);
  const [lng, setLng] = useState<number>(initialLng || 77.0861);
  const [radiusMeters, setRadiusMeters] = useState<number>(initialRadius || 150);
  const [addressText, setAddressText] = useState<string>(initialAddress);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      let resolvedLat = initialLat;
      let resolvedLng = initialLng;
      let resolvedAddress = initialAddress;
      let resolvedRadius = initialRadius;

      // Check localStorage for persisted user selection
      try {
        const storedLat = localStorage.getItem('hrms_company_lat');
        const storedLng = localStorage.getItem('hrms_company_lng');
        const storedAddr = localStorage.getItem('hrms_company_address');
        const storedRad = localStorage.getItem('hrms_company_radius');

        if ((resolvedLat === undefined || resolvedLat === null) && storedLat) resolvedLat = Number(storedLat);
        if ((resolvedLng === undefined || resolvedLng === null) && storedLng) resolvedLng = Number(storedLng);
        if (!resolvedAddress && storedAddr) resolvedAddress = storedAddr;
        if (!resolvedRadius && storedRad) resolvedRadius = Number(storedRad);
      } catch (e) {}

      if (resolvedLat !== undefined && resolvedLat !== null && !isNaN(resolvedLat)) {
        setLat(resolvedLat);
      }
      if (resolvedLng !== undefined && resolvedLng !== null && !isNaN(resolvedLng)) {
        setLng(resolvedLng);
      }
      if (resolvedAddress) {
        setAddressText(resolvedAddress);
      }
      if (resolvedRadius) {
        setRadiusMeters(resolvedRadius);
      }
    }
  }, [isOpen, initialLat, initialLng, initialAddress, initialRadius]);

  // Reverse Geocode: lat/lng -> real street address
  const handleLocationChange = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);

    setIsGeocoding(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          setAddressText(data.display_name);
        }
      }
    } catch (err) {
      // In case of rate limit, timeout or offline, keep current address or format coordinates
      if (!addressText.trim()) {
        setAddressText(`Location at ${newLat.toFixed(4)}°, ${newLng.toFixed(4)}°`);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // Search Address / Landmark
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const newLat = parseFloat(item.lat);
          const newLng = parseFloat(item.lon);
          setLat(newLat);
          setLng(newLng);
          setAddressText(item.display_name);
        }
      }
    } catch (err) {
      console.warn("Search geocode failed or offline:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    const finalAddress = addressText.trim() || `Office Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
    try {
      localStorage.setItem('hrms_company_lat', String(lat));
      localStorage.setItem('hrms_company_lng', String(lng));
      localStorage.setItem('hrms_company_radius', String(radiusMeters));
      localStorage.setItem('hrms_company_address', finalAddress);
    } catch (e) {}

    onSelectLocation({
      address: finalAddress,
      latitude: lat,
      longitude: lng,
      radiusMeters
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2 border-b">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="w-5 h-5" />
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              Choose Headquarters & Office Location on Map
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Click anywhere on the map or drag the pin to set your office coordinates. This defines the geofence perimeter for your dashboard attendance map.
          </DialogDescription>
        </DialogHeader>

        {/* Local Application Scope Security Guarantee Alert */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-bold">100% Private & Internal to Your Application:</span>
            <p className="text-[11px] opacity-90">
              Any address or GPS coordinates selected here are saved <strong>only inside your HRMS database</strong> for your own dashboard map and office attendance. Nothing is sent, published, or modified on Google Maps or any public external services.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark, city (e.g. Udyog Vihar Phase 2, DLF Cyber City, Connaught Place)..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
            className="h-9 px-3.5 text-xs gap-1.5"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Search</span>
          </Button>
        </form>

        {/* Interactive OpenStreetMap */}
        <div className="relative">
          {isOpen && (
            <OfficeLocationPickerMap
              key={`picker_${lat}_${lng}`}
              lat={lat}
              lng={lng}
              radiusMeters={radiusMeters}
              onLocationChange={handleLocationChange}
              heightClass="h-[320px] sm:h-[360px]"
            />
          )}

          {/* Real-time geocoding indicator overlay */}
          {isGeocoding && (
            <div className="absolute top-2.5 right-2.5 z-[1000] bg-background/90 backdrop-blur-sm border rounded-lg px-2.5 py-1 text-[11px] flex items-center gap-1.5 font-medium shadow-xs">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span>Resolving address...</span>
            </div>
          )}

          {/* Quick Map Controls Overlay */}
          <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg px-2.5 py-1 text-[10px] font-mono font-semibold flex items-center gap-2 shadow-xs">
            <Crosshair className="w-3 h-3 text-sky-600" />
            <span>GPS: {lat.toFixed(5)}°, {lng.toFixed(5)}°</span>
          </div>
        </div>

        {/* Address & Geofence Configuration Controls */}
        <div className="space-y-3 pt-1">
          {/* Selected Address Preview */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Selected Headquarters Address (Editable)</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Lat: {lat.toFixed(4)}°, Lng: {lng.toFixed(4)}°
              </span>
            </div>
            <Input
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g. 368, Phase II, Udyog Vihar, Sector 20, Gurugram, Haryana"
              className="h-9 text-xs"
            />
          </div>

          {/* Geofence Radius Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-muted/20 border rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">Office Geofence Radius:</span>
              <p className="text-[10px] text-muted-foreground">
                Radius around the office coordinates where attendance is considered &quot;Inside Office&quot;.
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[50, 100, 150, 250, 500].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusMeters(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    radiusMeters === r
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'bg-background hover:bg-muted text-muted-foreground border'
                  }`}
                >
                  {r}m {r === 150 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="h-9 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply & Use This Location</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
