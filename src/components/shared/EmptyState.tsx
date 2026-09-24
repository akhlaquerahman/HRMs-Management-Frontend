import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FolderX } from "lucide-react";
import { Button } from "../ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] border rounded-lg bg-card border-dashed">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4 text-muted-foreground">
        {icon || <FolderX className="h-10 w-10" />}
      </div>
      <h3 className="text-xl font-semibold tracking-tight mb-2">{t(title)}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{t(description)}</p>
      {action && (
        <Button onClick={action.onClick}>
          {t(action.label)}
        </Button>
      )}
    </div>
  );
}
