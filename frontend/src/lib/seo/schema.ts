import { getSiteOrigin } from "@/lib/seo/public-routes";

export function buildOrganizationJsonLd() {
  const origin = getSiteOrigin();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Quantum X",
    url: origin,
    logo: `${origin}/favicon.ico`,
  };
}

export function buildSoftwareApplicationJsonLd(params: {
  name: string;
  description: string;
  path: string;
}) {
  const origin = getSiteOrigin();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: params.name,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: params.description,
    url: `${origin}${params.path}`,
  };
}

export function buildWebPageJsonLd(params: {
  name: string;
  description: string;
  path: string;
}) {
  const origin = getSiteOrigin();

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: params.name,
    description: params.description,
    url: `${origin}${params.path}`,
  };
}
