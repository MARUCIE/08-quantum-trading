import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Pricing";
const pageDescription =
  "Pricing model for professional quantitative trading teams and internal research operations.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/pricing",
  keywords: ["quant platform pricing", "enterprise trading platform pricing"],
});

export default function PricingPage() {
  return (
    <>
      <JsonLd
        id="pricing-page-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Pricing",
            description: pageDescription,
            path: "/pricing",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground">
          Pricing is currently tailored for internal and enterprise deployment
          needs.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">Research</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Data + strategy research workspace, backtesting, and model
              evaluation.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">Execution</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Account-mode isolation, risk controls, and auditable execution
              workflows.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Contact sales for deployment scope and compliance requirements.
        </p>
      </div>
    </>
  );
}
