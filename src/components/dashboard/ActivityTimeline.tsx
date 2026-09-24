import React from 'react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  statusColor?: string; // e.g. "bg-green-500", "bg-blue-500"
}

interface ActivityTimelineProps {
  activities: Activity[];
  className?: string;
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        No recent activities.
      </div>
    );
  }

  return (
    <div className={cn("relative border-l-2 border-primary/20 ml-3 space-y-6", className)}>
      {activities.map((activity, idx) => (
        <div key={activity.id || idx} className="relative pl-6">
          <div className={cn(
            "absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-background", 
            activity.statusColor || "bg-primary"
          )} />
          <div className="text-sm font-medium">{activity.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(activity.timestamp), 'dd MMM yyyy, hh:mm a')}
          </div>
          {activity.description && (
            <p className="text-sm text-muted-foreground mt-2">{activity.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
