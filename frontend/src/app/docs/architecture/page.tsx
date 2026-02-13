import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Docs - Architecture";
const pageDescription =
  "System architecture boundaries for data, research, strategy, execution, and operations.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/docs/architecture",
  keywords: ["quant system architecture", "trading platform architecture", "control plane stream plane"],
});

export default function ArchitectureDocPage() {
  return (
    <>
      <JsonLd
        id="docs-architecture-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Architecture Overview",
            description: pageDescription,
            path: "/docs/architecture",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Architecture Overview</h1>
        <p className="text-muted-foreground">
          The platform is organized as a dual-plane design: control-plane APIs and
          stream-plane real-time channels.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Data to Research to Strategy to Execution path is explicitly typed</li>
          <li>Risk and audit are mandatory gatekeepers for production actions</li>
          <li>Observability follows SLO-first contracts</li>
        </ul>
      </div>
    </>
  );
}
