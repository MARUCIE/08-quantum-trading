import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Security";
const pageDescription =
  "Security posture for Quantum X covering authentication boundaries, sandboxing, and auditability.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/security",
  keywords: ["quant platform security", "api auth", "ws acl", "auditability"],
});

export default function SecurityPage() {
  return (
    <>
      <JsonLd
        id="security-page-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Security",
            description: pageDescription,
            path: "/security",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Security</h1>
        <p className="text-muted-foreground">
          Quantum X follows least-privilege design for API, WebSocket, runtime
          execution, and operational access.
        </p>
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-medium">Security controls</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Route-level API permissions and key-based authentication</li>
            <li>WebSocket token handshake and channel ACL</li>
            <li>Sandbox-by-default execution for critical automation tasks</li>
            <li>Auditable error and event contracts</li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          This product does not provide investment advice or guaranteed returns.
        </p>
      </div>
    </>
  );
}
