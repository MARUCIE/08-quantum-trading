import type { MetadataRoute } from "next";
import { PUBLIC_SURFACE_ROUTES, getSiteOrigin } from "@/lib/seo/public-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const now = new Date();

  return PUBLIC_SURFACE_ROUTES.map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/features" || path === "/docs" ? 0.8 : 0.7,
  }));
}
