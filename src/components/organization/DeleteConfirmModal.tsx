"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Power, Trash2, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "department" | "designation";
  item: {
    id: string;
    name: string;
    employeeCount?: number;
    designationCount?: number;
  } | null;
  onConfirmDeactivate: (id: string) => Promise<void>;
  onConfirmForceDelete: (id: string) => Promise<void>;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  type,
  item,
  onConfirmDeactivate,
  onConfirmForceDelete,
}: DeleteConfirmModalProps) {
  const [loadingAction, setLoadingAction] = useState<"deactivate" | "delete" | null>(null);

  if (!item) return null;

  const empCount = item.employeeCount || 0;
  const desigCount = item.designationCount || 0;
  const hasAssociations = empCount > 0 || desigCount > 0;

  const handleDeactivate = async () => {
    setLoadingAction("deactivate");
    try {
      await onConfirmDeactivate(item.id);
      onClose();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleForceDelete = async () => {
    setLoadingAction("delete");
    try {
      await onConfirmForceDelete(item.id);
      onClose();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <AlertTriangle className={`h-5 w-5 ${hasAssociations ? "text-amber-500" : "text-destructive"}`} />
            Delete {type === "department" ? "Department" : "Designation"}: {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-3 space-y-3 text-sm">
          {hasAssociations ? (
            <>
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium leading-relaxed">
                <p className="font-semibold text-sm mb-1 text-amber-700 dark:text-amber-300">
                  Active Staff & Structural Associations Found
                </p>
                This {type} currently has{" "}
                <span className="font-bold">{empCount} assigned employee(s)</span>
                {desigCount > 0 && (
                  <>
                    {" "}and <span className="font-bold">{desigCount} designation(s)</span>
                  </>
                )}
                . Hard deleting will unassign these staff members.
              </div>

              <p className="text-xs text-muted-foreground">
                Please select how you wish to process this organizational change:
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-xs leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-foreground">"{item.name}"</span>? This action will remove it permanently from the company structure.
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end border-t pt-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={!!loadingAction} className="h-9 text-xs">
            Cancel
          </Button>

          {hasAssociations ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDeactivate}
                disabled={!!loadingAction}
                className="h-9 text-xs font-semibold gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
              >
                {loadingAction === "deactivate" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Power className="h-3.5 w-3.5" />
                )}
                Deactivate (Recommended)
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleForceDelete}
                disabled={!!loadingAction}
                className="h-9 text-xs font-semibold gap-1.5"
              >
                {loadingAction === "delete" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Force Delete & Unassign
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleForceDelete}
              disabled={!!loadingAction}
              className="h-9 text-xs font-semibold gap-1.5"
            >
              {loadingAction === "delete" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete Permanently
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
