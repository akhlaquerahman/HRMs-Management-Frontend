"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

export default function PerformancePage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Performance" 
        description="Manage and view performance data."
      />
      
      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto w-fit max-w-full justify-start">
          {["Goals","Reviews","KPI"].map(tab => (
            <TabsTrigger key={tab} value={tab.toLowerCase().replace(/\s+/g, '-')} className="whitespace-nowrap px-4 py-2">
              {t(tab)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {["Goals","Reviews","KPI"].map(tab => (
          <TabsContent key={tab} value={tab.toLowerCase().replace(/\s+/g, '-')}>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t("ID")}</TableHead>
                    <TableHead>{t("Name")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead className="text-right">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* We will populate data here */}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <EmptyState 
                title="No records found" 
                description={`There are no ${t(tab).toLowerCase()} available at the moment.`}
                action={{ label: "Add New", onClick: () => {} }}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
