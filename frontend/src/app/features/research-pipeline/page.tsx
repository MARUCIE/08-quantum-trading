import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Feature - Research Pipeline";
const pageDescription =
  "Research pipeline for reproducible experiments, model evaluation, and controlled promotion to production.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/features/research-pipeline",
  keywords: ["quant research pipeline", "model evaluation", "experiment reproducibility"],
});

export default function ResearchPipelineFeaturePage() {
  return (
    <>
      <JsonLd
        id="feature-research-pipeline-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Research Pipeline",
            description: pageDescription,
            path: "/features/research-pipeline",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Research Pipeline</h1>
        <p className="text-muted-foreground">
          Quantum X links feature engineering, training, and evaluation to stable
          release criteria.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Dataset and feature lineage</li>
          <li>Walk-forward and stress validation stages</li>
          <li>Policy-based promotion gates</li>
        </ul>
      </div>
    </>
  );
}
