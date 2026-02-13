export const PUBLIC_SURFACE_ROUTES: readonly string[] = [
  "/about",
  "/pricing",
  "/security",
  "/features",
  "/features/strategy-system",
  "/features/risk-and-audit",
  "/features/account-modes",
  "/features/research-pipeline",
  "/docs",
  "/docs/architecture",
  "/docs/api-contract",
];

export const PUBLIC_ALLOWLIST_EXTRA: readonly string[] = [
  "/favicon.ico",
];

export function getSiteOrigin(): string {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  try {
    return new URL(candidate).origin;
  } catch {
    return "http://localhost:3000";
  }
}
