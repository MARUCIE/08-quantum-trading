"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { DynamicSidebar } from "@/components/layout/dynamic-sidebar";
import { Header } from "@/components/layout/header";
import { PublicHeader } from "@/components/layout/public-header";
import { PUBLIC_SURFACE_ROUTES } from "@/lib/seo/public-routes";

function normalizePath(path: string): string {
  if (!path) return "/";
  const trimmed = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
  return trimmed || "/";
}

function isAuthPath(path: string): boolean {
  return ["/login", "/register", "/forgot-password"].includes(path);
}

function isPublicPath(path: string): boolean {
  const normalized = normalizePath(path);
  if (PUBLIC_SURFACE_ROUTES.includes(normalized)) {
    return true;
  }

  // Keep prefix behavior for nested public docs/features routes.
  return ["/features", "/docs"].some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  const mode = useMemo(() => {
    const normalized = normalizePath(pathname);
    if (isAuthPath(normalized)) return "auth" as const;
    if (isPublicPath(normalized)) return "public" as const;
    return "app" as const;
  }, [pathname]);

  if (mode === "auth") {
    return (
      <main id="main-content" className="min-h-dvh bg-background" tabIndex={-1}>
        {children}
      </main>
    );
  }

  if (mode === "public") {
    return (
      <div className="min-h-dvh bg-background">
        <PublicHeader />
        <main id="main-content" className="px-4 py-8 md:px-6 md:py-10" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <DynamicSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-auto bg-background p-4 md:p-6 custom-scrollbar"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
