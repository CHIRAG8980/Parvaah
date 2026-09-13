#!/usr/bin/env bash
set -e

# ==============================================================================
# Parvaah Unified Development Runner
# Structured dual-stream logging for FastAPI (Backend) & Next.js (Frontend)
# Outputs colored prefixes to console & appends to logs/backend.log & logs/frontend.log
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

# ANSI Terminal Colors
CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_CYAN="\033[36m"
CLR_PURPLE="\033[35m"
CLR_GREEN="\033[32m"
CLR_GRAY="\033[90m"

cleanup() {
  echo ""
  echo -e "${CLR_BOLD}${CLR_GRAY}[PARVAAH]${CLR_RESET} Shutting down development servers..."
  # Terminate subshell process trees
  if [ -n "$BACKEND_PID" ]; then
    pkill -P "$BACKEND_PID" 2>/dev/null || true
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$WEB_PID" ]; then
    pkill -P "$WEB_PID" 2>/dev/null || true
    kill "$WEB_PID" 2>/dev/null || true
  fi
  # Clean up ports if still held
  fuser -k 8000/tcp 2>/dev/null || true
  fuser -k 3000/tcp 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Determine python command (prefer monorepo .venv, fallback to python3)
if [ -f "$ROOT_DIR/.venv/bin/python" ]; then
  PYTHON_BIN="$ROOT_DIR/.venv/bin/python"
elif [ -f "$ROOT_DIR/services/api/.venv/bin/python" ]; then
  PYTHON_BIN="$ROOT_DIR/services/api/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
else
  PYTHON_BIN="python"
fi

# Prefix formatters
prefix_backend() {
  while IFS= read -r line || [ -n "$line" ]; do
    echo -e "${CLR_CYAN}${CLR_BOLD}[BACKEND]${CLR_RESET}  $line"
    echo "[BACKEND] $line" >> "$BACKEND_LOG"
  done
}

prefix_frontend() {
  while IFS= read -r line || [ -n "$line" ]; do
    echo -e "${CLR_PURPLE}${CLR_BOLD}[FRONTEND]${CLR_RESET} $line"
    echo "[FRONTEND] $line" >> "$FRONTEND_LOG"
  done
}

echo -e "${CLR_BOLD}${CLR_GREEN}================================================================${CLR_RESET}"
echo -e "${CLR_BOLD}${CLR_GREEN}  Parvaah - Unified Development Environment${CLR_RESET}"
echo -e "  ${CLR_CYAN}Backend:${CLR_RESET}  http://localhost:8000 (FastAPI API & Docs)"
echo -e "  ${CLR_PURPLE}Frontend:${CLR_RESET} http://localhost:3000 (Next.js Dashboard)"
echo -e "  ${CLR_GRAY}Logs:${CLR_RESET}     $BACKEND_LOG"
echo -e "            $FRONTEND_LOG"
echo -e "${CLR_BOLD}${CLR_GREEN}================================================================${CLR_RESET}"

# Start Backend
(
  cd "$ROOT_DIR/services/api"
  PYTHONUNBUFFERED=1 "$PYTHON_BIN" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | prefix_backend
) &
BACKEND_PID=$!

# Start Frontend
(
  cd "$ROOT_DIR/apps/web"
  npx next dev -p 3000 2>&1 | prefix_frontend
) &
WEB_PID=$!

wait
