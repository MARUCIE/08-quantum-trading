import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import {
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/schema";

const pageTitle = "About";
const pageDescription =
  "Quantum X is an AI-native quantitative trading platform focused on reproducible research, risk controls, and auditable execution.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/about",
  keywords: ["about quantum x", "quant platform", "ai trading platform"],
});

export default function AboutPage() {
  return (
    <>
      <JsonLd id="org-schema" data={buildOrganizationJsonLd()} />
      <JsonLd
        id="software-schema"
        data={
          buildSoftwareApplicationJsonLd({
            name: "Quantum X",
            description: pageDescription,
            path: "/about",
          })
        }
      />
      <JsonLd
        id="about-page-schema"
        data={
          buildWebPageJsonLd({
            name: "About Quantum X",
            description: pageDescription,
            path: "/about",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">About Quantum X</h1>
        <p className="text-muted-foreground">
          Quantum X bridges quantitative research and production execution with a
          compliance-first operating model.
        </p>
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-medium">What we optimize for</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Backtest and live execution parity</li>
            <li>Risk gates and audit traceability</li>
            <li>Measurable reliability with SLO-driven observability</li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          Looking for implementation details? Visit the{" "}
          <Link href="/docs" className="underline">
            documentation hub
          </Link>
          .
        </p>
      </div>
    </>
  );
}
