import { ReactNode } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, Filter, Download, Upload, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButton?: ReactNode;
  onSearch?: (val: string) => void;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  showImport?: boolean;
  showCreate?: boolean;
}

export function PageHeader({ 
  title, 
  description, 
  actionButton, 
  onSearch, 
  showSearch = true, 
  showFilters = true, 
  showExport = false, 
  showImport = false,
  showCreate = true
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5 sm:gap-4 mb-2 sm:mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground truncate">{t(title)}</h1>
          {description && <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-none">{t(description)}</p>}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto mt-1 sm:mt-0 shrink-0">
          {showImport && (
            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {t("Import")}
            </Button>
          )}
          {showExport && (
            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {t("Export")}
            </Button>
          )}
          {actionButton ? actionButton : (
            showCreate && (
              <Button size="sm" className="h-8 sm:h-9 text-xs">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("Create New")}
              </Button>
            )
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
        {showSearch && (
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("Search in page...")}
              className="pl-8" 
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
