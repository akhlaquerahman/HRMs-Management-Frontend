import React from 'react';
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface QuickActionCardProps {
  title: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  description?: string;
  className?: string;
}

export function QuickActionCard({ title, icon: Icon, onClick, variant = "outline", description, className }: QuickActionCardProps) {
  return (
    <Button 
      variant={variant} 
      className={cn("h-auto flex flex-col items-center justify-center gap-3 p-6 rounded-xl hover:-translate-y-1 transition-transform shadow-sm", className)}
      onClick={onClick}
    >
      <Icon className="w-6 h-6" />
      <div className="flex flex-col items-center">
        <span className="font-semibold text-sm whitespace-normal text-center">{title}</span>
        {description && <span className="text-xs text-muted-foreground font-normal text-center mt-1">{description}</span>}
      </div>
    </Button>
  );
}
