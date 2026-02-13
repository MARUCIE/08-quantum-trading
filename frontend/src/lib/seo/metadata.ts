import type { Metadata } from "next";
import { getSiteOrigin } from "@/lib/seo/public-routes";

type PublicMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function buildPublicMetadata({
  title,
  description,
  path,
  keywords = [],
}: PublicMetadataInput): Metadata {
  const origin = getSiteOrigin();
  const canonical = `${origin}${path}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | Quantum X`,
      description,
      type: "website",
      url: canonical,
      siteName: "Quantum X",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Quantum X`,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}
