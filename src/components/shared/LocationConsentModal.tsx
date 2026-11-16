"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, Eye, Clock, Trash2, CheckCircle2 } from 'lucide-react';

interface LocationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isCurrentlyTracking?: boolean;
  onRevoke?: () => void;
}

export function LocationConsentModal({
  isOpen,
  onClose,
  onAccept,
  isCurrentlyTracking = false,
  onRevoke
}: LocationConsentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6 sm:p-7 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Live Location Tracking & Privacy Notice
              </DialogTitle>
              <div className="text-xs text-muted-foreground font-medium">
                Enterprise Workforce Transparency Compliance
              </div>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            HRMS Pro prioritizes your privacy. Location tracking is strictly transparent, consent-based, and active exclusively during your authenticated work session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-4 text-xs sm:text-sm">
          <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl border">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Why Location Is Collected:</span>
              <p className="text-muted-foreground text-xs mt-0.5">
                To verify attendance within assigned office geofences, confirm remote/field work presence, and provide HR/managers with live workforce distribution.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl border">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">When Tracking Starts & Stops:</span>
              <p className="text-muted-foreground text-xs mt-0.5">
                Collection only begins when you punch in and explicitly consent. Tracking <strong className="text-foreground">stops automatically</strong> when you punch out, pause, or manually revoke permission.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl border">
            <Eye className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Who Has Access:</span>
              <p className="text-muted-foreground text-xs mt-0.5">
                Only authorized HR Administrators and your direct Department Manager. Other employees and external parties never have access to your location.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl border">
            <Trash2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Data Retention & Purging:</span>
              <p className="text-muted-foreground text-xs mt-0.5">
                Live breadcrumb samples are automatically deleted after the company retention cycle (30 days). No location data is sold or shared.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {isCurrentlyTracking ? (
              <span className="text-blue-600 font-medium flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Sharing Active
              </span>
            ) : (
              'Sharing Inactive'
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isCurrentlyTracking && onRevoke ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  onRevoke();
                  onClose();
                }}
              >
                Stop Sharing
              </Button>
            ) : (
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onClose}>
                Not Now
              </Button>
            )}

            {!isCurrentlyTracking && (
              <Button
                type="button"
                className="w-full sm:w-auto font-semibold bg-primary text-primary-foreground gap-1.5"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Agree & Enable Live Tracking
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
