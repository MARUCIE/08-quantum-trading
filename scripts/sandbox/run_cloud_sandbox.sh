#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-cloud_probe}"
shift || true
SANDBOX_CMD="${*:-echo cloud-sandbox-probe}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="${SANDBOX_EVIDENCE_DIR:-$PROJECT_ROOT/outputs/sandbox/cloud}"
mkdir -p "$EVIDENCE_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$EVIDENCE_DIR/${TIMESTAMP}_${PROFILE}.log"

{
  echo "[cloud-sandbox] profile=$PROFILE"
  echo "[cloud-sandbox] command=$SANDBOX_CMD"
} | tee "$LOG_FILE"

if command -v daytona >/dev/null 2>&1; then
  {
    echo "[cloud-sandbox] provider=daytona"
    echo "[cloud-sandbox] status=available"
    echo "[cloud-sandbox] next_action=bind provider-specific sandbox template for this repository"
  } | tee -a "$LOG_FILE"
  exit 0
fi

if command -v modal >/dev/null 2>&1; then
  {
    echo "[cloud-sandbox] provider=modal"
    echo "[cloud-sandbox] status=available"
    echo "[cloud-sandbox] next_action=bind provider-specific sandbox template for this repository"
  } | tee -a "$LOG_FILE"
  exit 0
fi

{
  echo "[cloud-sandbox] provider=none"
  echo "[cloud-sandbox] status=unavailable"
  echo "[cloud-sandbox] fallback=local_sandbox"
} | tee -a "$LOG_FILE"
exit 4

