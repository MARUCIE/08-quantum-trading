"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Sidebar skeleton for loading state
function SidebarSkeleton() {
  return (
    <div className="hidden lg:flex w-64 flex-col border-r bg-card">
      <div className="p-4">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex-1 p-2 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

// Dynamic import with SSR enabled (sidebar can render on server)
export const DynamicSidebar = dynamic(
  () => import("./sidebar").then((mod) => mod.Sidebar),
  {
    ssr: true,
    loading: () => <SidebarSkeleton />,
  }
);
