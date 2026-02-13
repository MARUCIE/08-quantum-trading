import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Docs";
const pageDescription =
  "Documentation map for architecture, API contracts, and operating constraints.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/docs",
  keywords: ["quant trading docs", "system architecture docs", "api contract docs"],
});

const docs = [
  { href: "/docs/architecture", label: "System Architecture" },
  { href: "/docs/api-contract", label: "API Contract" },
];

export default function DocsLandingPage() {
  return (
    <>
      <JsonLd
        id="docs-page-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Documentation",
            description: pageDescription,
            path: "/docs",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          Canonical references for architecture boundaries and contract behavior.
        </p>
        <div className="grid gap-3">
          {docs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="rounded-lg border p-4 text-sm transition-colors hover:bg-accent"
            >
              {doc.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
