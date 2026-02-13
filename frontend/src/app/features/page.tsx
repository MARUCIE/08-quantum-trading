import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Features";
const pageDescription =
  "Core capability map: strategy system, risk and audit, account isolation, and research pipeline.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/features",
  keywords: [
    "quant trading features",
    "strategy system",
    "risk audit",
    "research pipeline",
  ],
});

const items = [
  { href: "/features/strategy-system", label: "Strategy System" },
  { href: "/features/risk-and-audit", label: "Risk & Audit" },
  { href: "/features/account-modes", label: "Account Modes" },
  { href: "/features/research-pipeline", label: "Research Pipeline" },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        id="features-page-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Features",
            description: pageDescription,
            path: "/features",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Features</h1>
        <p className="text-muted-foreground">
          Quantum X organizes capabilities around research reproducibility,
          execution safety, and observability.
        </p>
        <div className="grid gap-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border p-4 text-sm transition-colors hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
