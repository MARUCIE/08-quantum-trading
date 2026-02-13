import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function extractOpenApiPaths(openapiYaml: string): Set<string> {
  const paths = new Set<string>();
  const re = /^\s{2}(\/[^:\s]+)\s*:\s*$/gm;
  for (const match of openapiYaml.matchAll(re)) {
    const p = match[1];
    if (p.startsWith("/api/")) {
      paths.add(p);
    }
  }
  return paths;
}

function extractBackendRoutePaths(routesTs: string): Set<string> {
  const paths = new Set<string>();
  const re = /\bserver\.(get|post|put|delete)\(\s*['"]([^'"]+)['"]/g;
  for (const match of routesTs.matchAll(re)) {
    const p = match[2];
    if (p.startsWith("/api/")) {
      paths.add(p);
    }
  }
  return paths;
}

function normalizeBackendToOpenApi(pathname: string): string {
  // express-style ":id" -> OpenAPI "{id}".
  return pathname.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

describe("OpenAPI <-> backend route sync", () => {
  it("backend /api paths should match OpenAPI paths after param normalization", () => {
    // Vitest runs with CWD = backend/, so prefer cwd-based paths.
    const backendRoot = process.cwd();
    const openapiPath = path.resolve(backendRoot, "docs/openapi.yaml");
    const routesPath = path.resolve(backendRoot, "src/api/routes.ts");

    const openapiYaml = readFileSync(openapiPath, "utf-8");
    const routesTs = readFileSync(routesPath, "utf-8");

    const openapi = extractOpenApiPaths(openapiYaml);
    const backend = new Set(
      [...extractBackendRoutePaths(routesTs)].map(normalizeBackendToOpenApi)
    );

    const missingInOpenapi = [...backend].filter((p) => !openapi.has(p)).sort();
    const missingInBackend = [...openapi].filter((p) => !backend.has(p)).sort();

    expect(
      { missingInOpenapi, missingInBackend },
      "OpenAPI and backend routes are out of sync"
    ).toEqual({ missingInOpenapi: [], missingInBackend: [] });
  });
});
