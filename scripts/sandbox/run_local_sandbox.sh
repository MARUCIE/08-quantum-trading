#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <profile> <command...>" >&2
  exit 2
fi

PROFILE="$1"
shift
SANDBOX_CMD="$*"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="${SANDBOX_EVIDENCE_DIR:-$PROJECT_ROOT/outputs/sandbox/local}"
mkdir -p "$EVIDENCE_DIR"

# Defaults are selected by profile and can be overridden through SANDBOX_* env vars.
case "$PROFILE" in
  strict_offline)
    IMAGE="node:20-alpine"
    CPU="1.0"
    MEMORY="1024m"
    PIDS="128"
    TIMEOUT_SECONDS="300"
    NETWORK_MODE="none"
    ;;
  build_offline)
    IMAGE="node:20-alpine"
    CPU="2.0"
    MEMORY="2048m"
    PIDS="256"
    TIMEOUT_SECONDS="900"
    NETWORK_MODE="none"
    ;;
  integration_limited)
    IMAGE="node:20-alpine"
    CPU="2.0"
    MEMORY="4096m"
    PIDS="512"
    TIMEOUT_SECONDS="1800"
    NETWORK_MODE="bridge"
    ;;
  *)
    echo "Unknown profile: $PROFILE" >&2
    exit 2
    ;;
esac

# Allow explicit policy overrides per run.
IMAGE="${SANDBOX_IMAGE:-$IMAGE}"
CPU="${SANDBOX_CPU:-$CPU}"
MEMORY="${SANDBOX_MEMORY:-$MEMORY}"
PIDS="${SANDBOX_PIDS:-$PIDS}"
TIMEOUT_SECONDS="${SANDBOX_TIMEOUT_SECONDS:-$TIMEOUT_SECONDS}"
NETWORK_MODE="${SANDBOX_NETWORK_MODE:-$NETWORK_MODE}"

if [[ ! "$CPU" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "Invalid SANDBOX_CPU: $CPU" >&2
  exit 2
fi

if [[ ! "$PIDS" =~ ^[0-9]+$ ]]; then
  echo "Invalid SANDBOX_PIDS: $PIDS" >&2
  exit 2
fi

if [[ ! "$TIMEOUT_SECONDS" =~ ^[0-9]+$ ]]; then
  echo "Invalid SANDBOX_TIMEOUT_SECONDS: $TIMEOUT_SECONDS" >&2
  exit 2
fi

case "$NETWORK_MODE" in
  none|bridge) ;;
  *)
    echo "Invalid SANDBOX_NETWORK_MODE: $NETWORK_MODE (expected none|bridge)" >&2
    exit 2
    ;;
esac

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$EVIDENCE_DIR/${TIMESTAMP}_${PROFILE}.log"
META_FILE="$EVIDENCE_DIR/${TIMESTAMP}_${PROFILE}.meta"
TIMEOUT_MARKER="$EVIDENCE_DIR/${TIMESTAMP}_${PROFILE}.timeout"

{
  echo "[sandbox] profile=$PROFILE"
  echo "[sandbox] image=$IMAGE"
  echo "[sandbox] cpu=$CPU memory=$MEMORY pids=$PIDS timeout_seconds=$TIMEOUT_SECONDS"
  echo "[sandbox] network=$NETWORK_MODE workspace=read-only outputs=read-write tmpfs=/tmp"
  echo "[sandbox] command=$SANDBOX_CMD"
} | tee "$LOG_FILE"

cat >"$META_FILE" <<EOF
profile=$PROFILE
image=$IMAGE
cpu=$CPU
memory=$MEMORY
pids=$PIDS
timeout_seconds=$TIMEOUT_SECONDS
network_mode=$NETWORK_MODE
workspace_mount=$PROJECT_ROOT:/workspace:ro
outputs_mount=$PROJECT_ROOT/outputs:/workspace/outputs:rw
timestamp=$TIMESTAMP
EOF

docker_cmd=(
  docker run --rm
  --cpus "$CPU"
  --memory "$MEMORY"
  --pids-limit "$PIDS"
  --security-opt no-new-privileges:true
  --cap-drop ALL
  --user "$(id -u):$(id -g)"
  --read-only
  --tmpfs /tmp:rw,noexec,nosuid,size=256m
  --env HOME=/tmp
  --env NPM_CONFIG_CACHE=/tmp/npm-cache
  --volume "$PROJECT_ROOT:/workspace:ro"
  --volume "$PROJECT_ROOT/outputs:/workspace/outputs:rw"
  --workdir /workspace
)

if [[ "$NETWORK_MODE" == "none" ]]; then
  docker_cmd+=(--network none)
fi

if [[ "$NETWORK_MODE" == "bridge" ]]; then
  docker_cmd+=(--network bridge --add-host host.docker.internal:host-gateway)
fi

docker_cmd+=("$IMAGE" sh -lc "$SANDBOX_CMD")

("${docker_cmd[@]}") >>"$LOG_FILE" 2>&1 &
cmd_pid=$!

(
  sleep "$TIMEOUT_SECONDS"
  if kill -0 "$cmd_pid" 2>/dev/null; then
    echo "[sandbox] timeout reached (${TIMEOUT_SECONDS}s), terminating command" >>"$LOG_FILE"
    touch "$TIMEOUT_MARKER"
    kill "$cmd_pid" 2>/dev/null || true
  fi
) &
watchdog_pid=$!

set +e
wait "$cmd_pid"
exit_code=$?
set -e

kill "$watchdog_pid" 2>/dev/null || true

if [[ -f "$TIMEOUT_MARKER" ]]; then
  rm -f "$TIMEOUT_MARKER"
  # Match common timeout code for easier machine parsing.
  exit_code=124
fi

echo "[sandbox] exit_code=$exit_code" | tee -a "$LOG_FILE"
cat "$LOG_FILE"
exit "$exit_code"
