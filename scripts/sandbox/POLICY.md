# Sandbox Policy

This document defines the canonical execution policy for local sandbox runs.

## Profiles

| Profile | Network | CPU | Memory | PIDs | Timeout | Typical use |
|---|---|---:|---:|---:|---:|---|
| `strict_offline` | `none` | 1.0 | 1024m | 128 | 300s | Read-only verification and static checks |
| `build_offline` | `none` | 2.0 | 2048m | 256 | 900s | Build/test commands without egress |
| `integration_limited` | `bridge` | 2.0 | 4096m | 512 | 1800s | Controlled integration tasks |

## Filesystem Isolation

- `/workspace` is mounted read-only.
- `/workspace/outputs` is mounted read-write for evidence artifacts only.
- Container root filesystem is read-only with writable `/tmp` tmpfs.

## Runtime Hardening

- `--security-opt no-new-privileges:true`
- `--cap-drop ALL`
- Container runs as current host uid/gid.

## Override Knobs (per run)

- `SANDBOX_IMAGE`
- `SANDBOX_CPU`
- `SANDBOX_MEMORY`
- `SANDBOX_PIDS`
- `SANDBOX_TIMEOUT_SECONDS`
- `SANDBOX_NETWORK_MODE` (`none` or `bridge`)
- `SANDBOX_EVIDENCE_DIR`

All overrides are logged into `<timestamp>_<profile>.meta`.
