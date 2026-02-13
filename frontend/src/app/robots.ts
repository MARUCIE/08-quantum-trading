import type { MetadataRoute } from "next";
import {
  PUBLIC_ALLOWLIST_EXTRA,
  PUBLIC_SURFACE_ROUTES,
  getSiteOrigin,
} from "@/lib/seo/public-routes";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  const allow = [...PUBLIC_SURFACE_ROUTES, ...PUBLIC_ALLOWLIST_EXTRA];

  return {
    host: origin,
    sitemap: `${origin}/sitemap.xml`,
    rules: [
      {
        userAgent: "*",
        allow,
        disallow: "/",
      },
    ],
  };
}
