"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Users, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TreeNode = ({ node }: { node: any }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white dark:bg-slate-900 border shadow-sm rounded-xl p-4 w-64 flex items-center gap-4 relative z-10 hover:border-blue-300 transition-colors hover:shadow-md cursor-default">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
          {node.firstName[0]}{node.lastName[0]}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-gray-900 dark:text-slate-100 truncate">{node.firstName} {node.lastName}</span>
          <span className="text-xs text-blue-600 truncate font-medium flex items-center"><Briefcase className="w-3 h-3 mr-1"/>{node.designation?.name || "CEO"}</span>
          <span className="text-xs text-gray-500 dark:text-slate-400 truncate flex items-center mt-0.5"><Users className="w-3 h-3 mr-1"/>{node.department?.name || "Executive"}</span>
        </div>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="relative flex flex-col items-center">
          {/* Vertical line down from parent */}
          <div className="w-px h-8 bg-gray-300"></div>
          
          <div className="flex justify-center relative">
            {/* Horizontal connecting line if multiple children */}
            {node.children.length > 1 && (
              <div className="absolute top-0 h-px bg-gray-300 w-full" style={{ left: '50%', transform: 'translateX(-50%)', width: `calc(100% - ${100 / node.children.length}%)` }}></div>
            )}
            
            {node.children.map((child: any, idx: number) => (
              <div key={child.id} className="flex flex-col items-center px-4 relative">
                {/* Vertical line up from child */}
                <div className="w-px h-8 bg-gray-300"></div>
                <TreeNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function OrgChartTab() {
  const { data: res, isLoading } = useQuery({
    queryKey: ["orgChartData"],
    queryFn: async () => (await api.get("/org-setup/org-chart")).data
  });

  const rootNodes = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);

  return (
    <div className="bg-slate-50 border rounded-xl shadow-inner min-h-[600px] overflow-auto p-12 relative flex justify-center custom-scrollbar">
      {isLoading ? (
        <div className="flex flex-col items-center gap-8">
          <Skeleton className="h-20 w-64 rounded-xl" />
          <div className="flex gap-8">
            <Skeleton className="h-20 w-64 rounded-xl" />
            <Skeleton className="h-20 w-64 rounded-xl" />
          </div>
        </div>
      ) : rootNodes.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-slate-400">No hierarchy data available.</div>
      ) : (
        <div className="flex gap-16">
          {rootNodes.map((node: any) => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}
