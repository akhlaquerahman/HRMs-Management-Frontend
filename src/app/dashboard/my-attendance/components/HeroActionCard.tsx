"use client";

import { useState, useEffect } from 'react';
import { LogIn, LogOut, Coffee, MapPin, Clock, Utensils, Briefcase, PauseCircle, Play, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BREAK_TYPES = [
  { id: 'LUNCH', label: 'Lunch Break', icon: Utensils },
  { id: 'TEA', label: 'Tea / Coffee Break', icon: Coffee },
  { id: 'BIO', label: 'Bio Break', icon: PauseCircle },
  { id: 'OFFICIAL', label: 'Official Call', icon: Briefcase },
  { id: 'OTHER', label: 'Quick Break', icon: Clock }
];

export function HeroActionCard({
  statusData,
  statusLoading,
  onPunchIn,
  onPunchOut,
  onStartBreak,
  onEndBreak
}: {
  statusData: any,
  statusLoading: boolean,
  onPunchIn: () => void,
  onPunchOut: () => void,
  onStartBreak?: (type: string) => void,
  onEndBreak?: () => void
}) {
  const [liveTime, setLiveTime] = useState(new Date());
  const [workingDuration, setWorkingDuration] = useState("");
  const [breakTimer, setBreakTimer] = useState("00:00");

  const currentState = statusData?.currentState || "NOT_PUNCHED_IN";
  const currentRecord = statusData?.record;
  const activeBreak = statusData?.activeBreak || currentRecord?.breaks?.find((b: any) => !b.breakEnd);
  const punchInLog = currentRecord?.logs?.find((l: any) => !l.punchOut);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveTime(now);

      if (currentState === "PUNCHED_IN" && punchInLog?.punchIn) {
        const start = new Date(punchInLog.punchIn);
        const diff = now.getTime() - start.getTime();

        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

        setWorkingDuration(`${hours}:${minutes}:${seconds}`);
      } else {
        setWorkingDuration("00:00:00");
      }

      if (currentState === "ON_BREAK" && activeBreak?.breakStart) {
        const start = new Date(activeBreak.breakStart).getTime();
        const diffSec = Math.max(0, Math.floor((now.getTime() - start) / 1000));
        const hours = Math.floor(diffSec / 3600).toString().padStart(2, '0');
        const mins = Math.floor((diffSec % 3600) / 60).toString().padStart(2, '0');
        const secs = (diffSec % 60).toString().padStart(2, '0');
        setBreakTimer(`${hours}:${mins}:${secs}`);
      } else {
        setBreakTimer("00:00:00");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentState, punchInLog, activeBreak]);

  if (statusLoading) {
    return <div className="h-[200px] bg-card rounded-xl border shadow-sm animate-pulse" />;
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-xl border shadow-sm p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Clock className="w-48 h-48" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="text-sm font-medium text-primary uppercase tracking-wider">
            {format(liveTime, 'EEEE, dd MMMM yyyy')}
          </div>
          <h2 className="text-4xl font-bold font-mono tracking-tight text-foreground">
            {format(liveTime, 'hh:mm:ss a')}
          </h2>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>HQ Office</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coffee className="w-4 h-4" />
              <span>Standard Shift (09:00 - 18:00)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-background/50 backdrop-blur-md rounded-2xl p-6 border shadow-sm w-full md:w-[340px]">
          {currentState === "NOT_PUNCHED_IN" ? (
            <>
              <div className="text-sm text-muted-foreground mb-4">Ready to start your day?</div>
              <Button size="lg" className="w-full font-semibold h-12 text-base shadow-lg transition-transform active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onPunchIn}>
                <LogIn className="w-5 h-5 mr-2" /> Punch In Now
              </Button>
            </>
          ) : currentState === "PUNCHED_IN" ? (
            <>
              <div className="text-sm text-muted-foreground mb-1">
                {punchInLog?.punchIn ? `Working Since ${format(new Date(punchInLog.punchIn), 'hh:mm a')}` : 'Working'}
              </div>
              <div className="text-3xl font-mono font-bold text-primary mb-4 animate-pulse">{workingDuration}</div>
              
              <div className="flex items-center gap-2 w-full">
                {onStartBreak && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="lg" variant="outline" className="border-amber-200 bg-amber-50 text-amber-900 font-semibold h-12 gap-1.5 px-3">
                        <Coffee className="w-4 h-4 text-amber-600" /> Break <ChevronDown className="w-4 h-4 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-bold uppercase text-muted-foreground">Select Break Type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {BREAK_TYPES.map(b => (
                        <DropdownMenuItem key={b.id} onSelect={() => onStartBreak(b.id)} className="cursor-pointer gap-2 text-xs font-medium">
                          <b.icon className="w-4 h-4 text-amber-600" /> {b.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <Button size="lg" variant="destructive" className="flex-1 font-semibold h-12 text-base shadow-lg transition-transform active:scale-95" onClick={onPunchOut}>
                  <LogOut className="w-5 h-5 mr-2" /> Punch Out
                </Button>
              </div>
            </>
          ) : currentState === "ON_BREAK" ? (
            <>
              <div className="text-sm text-muted-foreground mb-1 font-medium">Currently on Break</div>
              <div className="text-3xl font-mono font-extrabold text-amber-600 mb-4 animate-pulse">⏱ {breakTimer}</div>
              {onEndBreak && (
                <Button size="lg" className="w-full font-bold h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-transform active:scale-95" onClick={onEndBreak}>
                  <Play className="w-5 h-5 mr-2 fill-white" /> Resume Work
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">Shift completed for today.</div>
              <div className="text-2xl font-bold text-emerald-600">Great Job!</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

