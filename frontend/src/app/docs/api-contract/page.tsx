import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Docs - API Contract";
const pageDescription =
  "HTTP and WebSocket contract boundaries including auth model, error schema, and access policies.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/docs/api-contract",
  keywords: ["api contract", "websocket acl", "error schema", "auth policy"],
});

export default function ApiContractDocPage() {
  return (
    <>
      <JsonLd
        id="docs-api-contract-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X API Contract",
            description: pageDescription,
            path: "/docs/api-contract",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">API Contract</h1>
        <p className="text-muted-foreground">
          Non-public REST endpoints and WebSocket channels enforce permission-based
          access controls.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Error schema: <code>{"{ message, code, status }"}</code></li>
          <li>Route-level permission mapping for API</li>
          <li>Token handshake and channel ACL for WebSocket</li>
        </ul>
      </div>
    </>
  );
}
