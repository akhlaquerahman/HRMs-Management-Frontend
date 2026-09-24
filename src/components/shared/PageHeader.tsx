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
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t(title)}</h1>
          {description && <p className="text-muted-foreground mt-1">{t(description)}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          {showImport && (
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              {t("Import")}
            </Button>
          )}
          {showExport && (
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t("Export")}
            </Button>
          )}
          {actionButton ? actionButton : (
            showCreate && (
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
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
