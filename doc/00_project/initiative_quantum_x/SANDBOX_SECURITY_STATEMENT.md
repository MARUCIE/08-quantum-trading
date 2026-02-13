# SANDBOX SECURITY STATEMENT (2026-02-11)

- SOP: `1.11 智能体平台全局沙盒化`
- Run ID: `1-11-7012f820`
- Evidence root: `outputs/sop-global-sandbox/1-11-7012f820/`

## Security Objectives
- Enforce sandbox-by-default for key engineering tasks.
- Limit network egress and filesystem write scope.
- Apply explicit resource quotas and command timeout policy.
- Keep execution evidence auditable and reproducible.

## Isolation Baseline
| Control | Policy |
|---|---|
| Runtime boundary | Docker-based local sandbox (`scripts/sandbox/run_local_sandbox.sh`) |
| Network default | `none` (offline by default) |
| Filesystem default | workspace read-only, only `/workspace/outputs` + `/tmp` writable |
| Runtime hardening | `--security-opt no-new-privileges:true` + `--cap-drop ALL` |
| Resource quotas | per-profile CPU/memory/PIDs limits (see `configs/sandbox/sandbox_policy.yaml`) |
| Timeout | host-side watchdog kill on profile timeout; normalized timeout exit code `124` |
| Cloud fallback | provider probe (`daytona` -> `modal`), fallback local when unavailable |
| Audit metadata | each run writes `<timestamp>_<profile>.meta` with resolved policy values |

## Profile Matrix
| Profile | Scope | Network | Quota | Timeout |
|---|---|---|---|---|
| `strict_offline` | docs/security checks | none | 1 CPU / 1GB / 128 pids | 300s |
| `build_offline` | typecheck/build | none | 2 CPU / 2GB / 256 pids | 900s |
| `integration_limited` | integration/e2e | bridge (local constrained) | 2 CPU / 4GB / 512 pids | 1800s |

## Key Task Mapping
- Source: `configs/sandbox/key_task_profiles.yaml`
- `doc_structure_check` -> `strict_offline`
- `backend_typecheck` -> `build_offline`
- `sandbox_network_guard_probe` -> `strict_offline`
- `persona_flow_smoke` -> `integration_limited`

## Evidence
- `reports/precheck_summary.md`
- `reports/resource_quota_timeout_policy.md`
- `reports/sandbox_execution_evidence.md`
- `logs/20260211-231959_strict_offline.log` (`network_blocked`)
- `logs/20260211-232028_strict_offline.log` (`Read-only file system`)
- `logs/20260211-233416_strict_offline.log` (`timeout reached`, `exit_code=124`)
- `logs/20260211-232015_build_offline.log` (`npm run typecheck` pass in offline sandbox)
- `logs/20260211-232037_cloud_probe.log` (cloud provider probe fallback local)
