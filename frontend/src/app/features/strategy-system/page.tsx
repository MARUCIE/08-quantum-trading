import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Feature - Strategy System";
const pageDescription =
  "Design for multi-strategy generation, evaluation, and controlled promotion from research to execution.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/features/strategy-system",
  keywords: ["strategy lifecycle", "quant strategy system", "research to execution"],
});

export default function StrategySystemFeaturePage() {
  return (
    <>
      <JsonLd
        id="feature-strategy-system-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Strategy System",
            description: pageDescription,
            path: "/features/strategy-system",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Strategy System</h1>
        <p className="text-muted-foreground">
          Build, evaluate, and promote strategies through deterministic gates with
          clear rollback paths.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Unified contracts for signal, order, and execution lifecycle</li>
          <li>Backtest/live parity as release gate</li>
          <li>Versioned rollout with audit traces</li>
        </ul>
      </div>
    </>
  );
}
