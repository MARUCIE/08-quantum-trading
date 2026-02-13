import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  PUBLIC_ALLOWLIST_EXTRA,
  PUBLIC_SURFACE_ROUTES,
  getSiteOrigin,
} from "@/lib/seo/public-routes";

describe("seo runtime contract", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps PUBLIC_SURFACE_ROUTES unique and path-normalized", () => {
    const seen = new Set<string>();

    for (const route of PUBLIC_SURFACE_ROUTES) {
      expect(route.startsWith("/")).toBe(true);
      expect(route.endsWith("/")).toBe(false);
      expect(route).not.toContain("//");
      expect(seen.has(route)).toBe(false);
      seen.add(route);
    }

    expect(seen.size).toBe(PUBLIC_SURFACE_ROUTES.length);
  });

  it("never leaks authenticated app routes into public surface", () => {
    const privateAppRoutes = ["/accounts", "/trading", "/risk", "/settings"];

    for (const route of privateAppRoutes) {
      expect(PUBLIC_SURFACE_ROUTES).not.toContain(route);
    }
  });

  it("builds sitemap directly from public route registry", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://quantum.example");

    const origin = getSiteOrigin();
    const entries = sitemap();
    const expectedUrls = PUBLIC_SURFACE_ROUTES.map((route) => `${origin}${route}`);

    expect(entries).toHaveLength(PUBLIC_SURFACE_ROUTES.length);
    expect(entries.map((entry) => entry.url)).toEqual(expectedUrls);

    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.changeFrequency).toBe("weekly");
      expect(entry.priority).toBe(
        entry.url.endsWith("/features") || entry.url.endsWith("/docs") ? 0.8 : 0.7
      );
    }
  });

  it("keeps robots allowlist aligned with public route registry", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://quantum.example");

    const origin = getSiteOrigin();
    const robotsMeta = robots();
    const rules = Array.isArray(robotsMeta.rules)
      ? robotsMeta.rules[0]
      : robotsMeta.rules;

    expect(robotsMeta.host).toBe(origin);
    expect(robotsMeta.sitemap).toBe(`${origin}/sitemap.xml`);
    expect(rules.allow).toEqual([...PUBLIC_SURFACE_ROUTES, ...PUBLIC_ALLOWLIST_EXTRA]);
    expect(rules.disallow).toBe("/");
  });
});
