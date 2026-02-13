import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Feature - Risk and Audit";
const pageDescription =
  "Risk guardrails and audit evidence model for production-safe quantitative operations.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/features/risk-and-audit",
  keywords: ["trading risk control", "audit evidence", "quant compliance"],
});

export default function RiskAndAuditFeaturePage() {
  return (
    <>
      <JsonLd
        id="feature-risk-audit-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Risk and Audit",
            description: pageDescription,
            path: "/features/risk-and-audit",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Risk and Audit</h1>
        <p className="text-muted-foreground">
          Every order path is governed by risk checks and traceable event records.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Pre-trade validation and policy enforcement</li>
          <li>Structured error contracts and diagnostic context</li>
          <li>Auditable event timeline across API and execution layers</li>
        </ul>
      </div>
    </>
  );
}
