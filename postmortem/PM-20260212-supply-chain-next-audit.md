# Postmortem: Next.js Supply-Chain High Vulnerability (2026-02-12)

- ID: PM-20260212-supply-chain-next-audit
- Scope: frontend dependency security gate
- Release Range: 57acb0611898d5a1e36b94402279b9e3d9f2674d...HEAD
- Status: fixed

## Symptom
- `npm audit` reported one high-severity vulnerability in `next@16.1.4`.

## Root Cause
- Dependency version drift: `next` remained on a vulnerable patch version.
- CI pipeline had no dedicated supply-chain gate enforcing high-severity audit policy.

## Fix
- Upgraded `frontend`:
  - `next` -> `16.1.6`
  - `eslint-config-next` -> `16.1.6`
- Added CI `Supply Chain Security Gate` with:
  - `npm audit --audit-level=high`
  - `lockfile-lint`
  - `detect-secrets`
  - conditional `pip-audit` + `safety`
  - new dependency allowlist gate script

## Verification
- post-fix audit: high=0 critical=0
- local gate verification: PASS
- evidence: `outputs/3.9/3-9-38510f7f/reports/step3_high_vuln_resolution.md`

## Prevention
- Enforce supply-chain CI gate on all PRs and pushes.
- Require allowlist update for any new dependency introduction.
- Monthly report archive under `outputs/3.9-supply-chain/`.

## Triggers (machine-matchable)
- Keywords:
  - `GHSA-h25m-26qc-wcjf`
  - `next@16.1.4`
  - `npm audit --audit-level=high`
  - `supply-chain-gate`
- Paths:
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `.github/workflows/ci.yml`
  - `scripts/ci/check-new-dependencies.mjs`
- Regex:
  - `"next"\s*:\s*"\^?16\.1\.[0-5]"`
  - `GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}`
  - `npm\s+audit\s+--audit-level=high`
