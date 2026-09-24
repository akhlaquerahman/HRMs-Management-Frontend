import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface ModuleSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ModuleSection({ title, description, children }: ModuleSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 py-4">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">{t(title)}</h3>
        {description && <p className="text-sm text-muted-foreground">{t(description)}</p>}
      </div>
      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}
