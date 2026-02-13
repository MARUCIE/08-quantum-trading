import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/schema";

const pageTitle = "Feature - Account Modes";
const pageDescription =
  "Strict separation between simulated and real account execution planes.";

export const metadata: Metadata = buildPublicMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/features/account-modes",
  keywords: ["simulated account mode", "real trading mode", "execution isolation"],
});

export default function AccountModesFeaturePage() {
  return (
    <>
      <JsonLd
        id="feature-account-modes-schema"
        data={
          buildWebPageJsonLd({
            name: "Quantum X Account Modes",
            description: pageDescription,
            path: "/features/account-modes",
          })
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Account Modes</h1>
        <p className="text-muted-foreground">
          Simulated and real trading paths are isolated by contract, permissions,
          and audit scope.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Explicit activation for real accounts</li>
          <li>Execution path isolation to prevent mode leakage</li>
          <li>Permission-scoped API and WebSocket behavior</li>
        </ul>
      </div>
    </>
  );
}
