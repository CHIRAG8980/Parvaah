#!/usr/bin/env bash
set -e

# ==============================================================================
# Parvaah Unified CLI Entrypoint
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ACTION="$1"
shift || true

case "$ACTION" in
  --setup|-s|setup)
    exec "$ROOT_DIR/scripts/setup.sh" "$@"
    ;;
  --dev|-d|dev)
    exec "$ROOT_DIR/scripts/dev.sh" "$@"
    ;;
  --test|-t|test)
    if [ -f "$ROOT_DIR/.venv/bin/pytest" ]; then
      exec "$ROOT_DIR/.venv/bin/pytest" apps/backend/tests "$@"
    else
      exec pytest apps/backend/tests "$@"
    fi
    ;;
  --build|-b|build)
    exec npm run build
    ;;
  --help|-h|help|"")
    echo "Parvaah Unified CLI"
    echo ""
    echo "Usage: ./cli.sh [command|flag]"
    echo ""
    echo "Options:"
    echo "  --setup, -s    Bootstrap full fresh environment (venv, dependencies, database seeding)"
    echo "  --dev, -d      Run FastAPI backend and Next.js frontend development servers"
    echo "  --test, -t     Run automated backend pytest suite"
    echo "  --build, -b    Build all workspace packages and Next.js web application"
    echo "  --help, -h     Show this help menu"
    echo ""
    ;;
  *)
    echo "Unknown option: $ACTION"
    echo "Run './cli.sh --help' for usage."
    exit 1
    ;;
esac
