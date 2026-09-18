#!/usr/bin/env bash
set -e

# ==============================================================================
# Parvaah Monorepo Setup Script
# Bootstraps a fresh development environment:
# 1. Copies .env.example -> .env if needed
# 2. Creates Python virtual environment (.venv)
# 3. Installs Python dependencies (requirements.txt)
# 4. Installs Node.js workspace dependencies (pnpm)
# 5. Builds shared packages (@landslide/config, @landslide/types, @landslide/ui)
# 6. Initializes and seeds the database (GSI zones, MoRTH roads, DMO officers)
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ANSI Terminal Colors
CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_GREEN="\033[32m"
CLR_CYAN="\033[36m"
CLR_YELLOW="\033[33m"
CLR_RED="\033[31m"
CLR_GRAY="\033[90m"

log_info() {
  echo -e "${CLR_BOLD}${CLR_CYAN}[SETUP]${CLR_RESET} $1"
}

log_success() {
  echo -e "${CLR_BOLD}${CLR_GREEN}[SUCCESS]${CLR_RESET} $1"
}

log_warn() {
  echo -e "${CLR_BOLD}${CLR_YELLOW}[WARN]${CLR_RESET} $1"
}

log_error() {
  echo -e "${CLR_BOLD}${CLR_RED}[ERROR]${CLR_RESET} $1"
}

echo -e "${CLR_BOLD}${CLR_GREEN}================================================================${CLR_RESET}"
echo -e "${CLR_BOLD}${CLR_GREEN}  Parvaah - Automated Project Setup${CLR_RESET}"
echo -e "  Root Directory: ${CLR_GRAY}$ROOT_DIR${CLR_RESET}"
echo -e "${CLR_BOLD}${CLR_GREEN}================================================================${CLR_RESET}"

# 1. Environment Configuration
log_info "Step 1/5: Checking environment configuration (.env)..."
if [ ! -f "$ROOT_DIR/.env" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    log_success "Created .env from .env.example"
  else
    log_warn ".env.example not found. Creating minimal default .env"
    cat << 'EOF' > "$ROOT_DIR/.env"
NODE_ENV=development
ENVIRONMENT=development
DATABASE_URL=sqlite:///./parvaah_dev.db
PORT=8000
API_HOST=0.0.0.0
API_PORT=8000
API_V1_PREFIX=/api/v1
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Parvaah Landslide Risk Monitor"
MOBILE_API_BASE_URL=http://10.0.2.2:8000
EOF
    log_success "Created default .env"
  fi
else
  log_info ".env file already exists."
fi

# 2. Python Virtual Environment & Dependencies
log_info "Step 2/5: Setting up Python environment..."
SYSTEM_PYTHON=""
if command -v python3.11 >/dev/null 2>&1; then
  SYSTEM_PYTHON="python3.11"
elif command -v python3 >/dev/null 2>&1; then
  SYSTEM_PYTHON="python3"
elif command -v python >/dev/null 2>&1; then
  SYSTEM_PYTHON="python"
else
  log_error "Python 3 is required but not found in PATH."
  exit 1
fi

log_info "Using Python binary: $($SYSTEM_PYTHON --version)"

if [ ! -d "$ROOT_DIR/.venv" ]; then
  log_info "Creating virtual environment at .venv..."
  "$SYSTEM_PYTHON" -m venv "$ROOT_DIR/.venv"
  log_success "Virtual environment created."
fi

VENV_PYTHON="$ROOT_DIR/.venv/bin/python"

log_info "Installing Python dependencies from requirements.txt..."
"$VENV_PYTHON" -m pip install --quiet --upgrade pip
"$VENV_PYTHON" -m pip install --quiet -r "$ROOT_DIR/requirements.txt"
log_success "Python dependencies installed."

# 3. Node.js & Monorepo Packages
log_info "Step 3/5: Setting up Node.js & monorepo workspace dependencies..."
if command -v npm >/dev/null 2>&1; then
  npm install
else
  log_error "npm not found in PATH."
  exit 1
fi
log_success "Node.js dependencies installed."

# 4. Build Shared Monorepo Packages
log_info "Step 4/5: Building shared TypeScript packages..."
npm run build --workspaces --if-present
log_success "Monorepo packages built successfully."

# 5. Database Initialization & Ingestion
log_info "Step 5/5: Initializing and seeding database..."
(
  cd "$ROOT_DIR/apps/backend"
  PYTHONPATH="$ROOT_DIR/apps/backend" "$VENV_PYTHON" -c "
from app.database import SessionLocal, init_db
from app.ingest.real_data_loader import run_real_ingestion
init_db()
db = SessionLocal()
run_real_ingestion(db)
db.close()
"
)
log_success "Database initialized and ingested with GSI zones, MoRTH roads, and telemetry."

echo ""
echo -e "${CLR_BOLD}${CLR_GREEN}================================================================${CLR_RESET}"
echo -e "${CLR_BOLD}${CLR_GREEN}  🎉 Parvaah setup completed successfully!${CLR_RESET}"
echo -e "${CLR_BOLD}${CLR_GREEN}================================================================${CLR_RESET}"
echo -e "To start the development servers:"
echo -e "  ${CLR_CYAN}./cli.sh --dev${CLR_RESET}   (or ${CLR_CYAN}npm run dev${CLR_RESET} / ${CLR_CYAN}./scripts/dev.sh${CLR_RESET})"
echo -e "To run all test suites:"
echo -e "  ${CLR_CYAN}./cli.sh --test${CLR_RESET}  (or ${CLR_CYAN}pytest apps/backend/tests${CLR_RESET})"
echo -e "To launch backend alone:"
echo -e "  ${CLR_CYAN}npm run dev:backend${CLR_RESET}"
echo -e "To launch web alone:"
echo -e "  ${CLR_CYAN}npm run dev:web${CLR_RESET}"
echo -e "${CLR_BOLD}${CLR_GREEN}================================================================${CLR_RESET}"
