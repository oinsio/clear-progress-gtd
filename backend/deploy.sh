#!/usr/bin/env bash
# =============================================================================
# Clear Progress — Backend Deployment Script
# Google Apps Script deployment via clasp
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
CLASP_FILE="$SCRIPT_DIR/.clasp.json"

# ─── Colors ──────────────────────────────────────────────────────────────────
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
CYAN=$'\033[0;36m'
NC=$'\033[0m' # No Color

# ─── Helpers ─────────────────────────────────────────────────────────────────

info()    { echo -e "${BLUE}ℹ${NC}  $*"; }
success() { echo -e "${GREEN}✔${NC}  $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✖${NC}  $*" >&2; }

die() {
  error "$@"
  exit 1
}

confirm() {
  local prompt="$1"
  echo -en "${YELLOW}${prompt} [y/N]:${NC} "
  read -r answer
  [[ "$answer" =~ ^[Yy]$ ]]
}

# ─── Validation ──────────────────────────────────────────────────────────────

check_clasp() {
  command -v clasp >/dev/null 2>&1 || die "clasp not found. Install: npm install -g @google/clasp"
}

check_env() {
  [[ -f "$ENV_FILE" ]] || die ".env file not found. Copy .env.example → .env and fill in values."
}

check_clasp_config() {
  [[ -f "$CLASP_FILE" ]] || die ".clasp.json not found. Run: clasp clone <scriptId> --rootDir $SCRIPT_DIR"
}

load_env() {
  check_env
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
}

get_deploy_id() {
  local env="$1"
  case "$env" in
    dev)  echo "${DEPLOY_ID_DEV:-}" ;;
    prod) echo "${DEPLOY_ID_PROD:-}" ;;
    *)    die "Unknown environment: $env. Use 'dev' or 'prod'." ;;
  esac
}

get_deploy_url() {
  local deploy_id="$1"
  echo "https://script.google.com/macros/s/${deploy_id}/exec"
}

# ─── Commands ────────────────────────────────────────────────────────────────

cmd_build() {
  info "Running tests..."
  cd "$SCRIPT_DIR"
  npm install --silent
  npm run test
  info "Check tests quality..."
  npm run test:mutation
  info "Compiling TypeScript..."
  rm -rf dist/
  npm run build
  success "Build complete."
}

cmd_push() {
  cmd_build
  info "Pushing code to Apps Script..."
  cd "$SCRIPT_DIR"
  clasp push
  success "Code pushed successfully."
}

cmd_deploy() {
  local env="${1:-}"
  [[ -z "$env" ]] && die "Usage: deploy.sh deploy <dev|prod>"

  load_env

  local deploy_id
  deploy_id="$(get_deploy_id "$env")"
  [[ -z "$deploy_id" ]] && die "DEPLOY_ID_$(echo "$env" | tr '[:lower:]' '[:upper:]') is not set in .env"

  # Confirm for prod
  if [[ "$env" == "prod" ]]; then
    warn "You are about to deploy to PRODUCTION."
    confirm "Continue?" || { info "Aborted."; exit 0; }
  fi

  local description
  description="$env — $(date +%Y-%m-%d\ %H:%M:%S)"

  cmd_build
  info "Pushing code..."
  cd "$SCRIPT_DIR"
  clasp push

  info "Deploying to ${CYAN}${env}${NC} (deployment: ${deploy_id:0:20}...)..."
  clasp deploy --deploymentId "$deploy_id" --description "$description"

  local url
  url="$(get_deploy_url "$deploy_id")"

  echo ""
  success "Deployed to ${CYAN}${env}${NC}"
  info "URL: ${url}"
  echo ""

  # Auto-ping
  cmd_ping "$env" || true
}

cmd_deploy_new() {
  local env="${1:-}"
  [[ -z "$env" ]] && die "Usage: deploy.sh deploy:new <dev|prod>"

  local description
  description="$env — $(date +%Y-%m-%d\ %H:%M:%S) [initial]"

  cmd_build
  info "Pushing code..."
  cd "$SCRIPT_DIR"
  clasp push

  info "Creating new deployment for ${CYAN}${env}${NC}..."
  local output
  output="$(clasp deploy --description "$description" 2>&1)"
  echo "$output"

  echo ""
  warn "Save the deployment ID above to .env as DEPLOY_ID_$(echo "$env" | tr '[:lower:]' '[:upper:]')"
  echo ""
}

cmd_status() {
  check_clasp
  check_clasp_config

  info "Fetching deployments..."
  cd "$SCRIPT_DIR"
  clasp deployments

  if [[ -f "$ENV_FILE" ]]; then
    load_env
    echo ""
    info "Configured deployment IDs:"
    echo "  dev:  ${DEPLOY_ID_DEV:-<not set>}"
    echo "  prod: ${DEPLOY_ID_PROD:-<not set>}"
  fi
}

cmd_ping() {
  local env="${1:-}"
  [[ -z "$env" ]] && die "Usage: deploy.sh ping <dev|prod>"

  load_env

  local deploy_id
  deploy_id="$(get_deploy_id "$env")"
  [[ -z "$deploy_id" ]] && die "DEPLOY_ID_$(echo "$env" | tr '[:lower:]' '[:upper:]') is not set in .env"

  local url
  url="$(get_deploy_url "$deploy_id")?action=ping"

  info "Pinging ${CYAN}${env}${NC}..."

  local http_code
  local response
  response="$(curl -sS -w "\n%{http_code}" -L --max-time 30 "$url" 2>&1)" || {
    error "Request failed. Check your network or deployment URL."
    return 1
  }

  http_code="$(echo "$response" | tail -1)"
  local body
  body="$(echo "$response" | sed '$d')"

  if [[ "$http_code" =~ ^2 ]]; then
    success "Backend is reachable (HTTP ${http_code})"
    echo "  Response: ${body}"
  else
    error "Backend returned HTTP ${http_code}"
    echo "  Response: ${body}"
    return 1
  fi
}

cmd_open() {
  check_clasp
  check_clasp_config

  info "Opening Apps Script editor..."
  cd "$SCRIPT_DIR"
  clasp open
}

cmd_logs() {
  check_clasp
  check_clasp_config

  info "Fetching execution logs..."
  cd "$SCRIPT_DIR"
  clasp logs
}

# ─── Usage ───────────────────────────────────────────────────────────────────

usage() {
  cat <<EOF
${CYAN}Clear Progress${NC} — Backend Deployment

${YELLOW}Usage:${NC}
  ./deploy.sh <command> [options]

${YELLOW}Commands:${NC}
  push                Push code to Apps Script (no deployment)
  deploy <env>        Push + update existing deployment (dev|prod)
  deploy:new <env>    Push + create a new deployment (first time only)
  status              List all deployments and configured IDs
  ping <env>          Check backend availability (dev|prod)
  open                Open Apps Script editor in browser
  logs                Show execution logs

${YELLOW}Examples:${NC}
  ./deploy.sh push              # Push code only
  ./deploy.sh deploy dev        # Deploy to dev
  ./deploy.sh deploy prod       # Deploy to prod (with confirmation)
  ./deploy.sh deploy:new dev    # First deploy — creates new deployment
  ./deploy.sh ping prod         # Check if prod is alive
  ./deploy.sh status            # List deployments

${YELLOW}Setup:${NC}
  1. cp .env.example .env
  2. Fill in SCRIPT_ID and run: clasp clone <SCRIPT_ID> --rootDir .
  3. ./deploy.sh deploy:new dev    → save deployment ID to .env
  4. ./deploy.sh deploy:new prod   → save deployment ID to .env
  5. ./deploy.sh deploy dev        → routine deploys

EOF
}

# ─── Main ────────────────────────────────────────────────────────────────────

main() {
  local cmd="${1:-}"
  shift || true

  check_clasp
  check_clasp_config

  case "$cmd" in
    push)        cmd_push ;;
    deploy)      cmd_deploy "$@" ;;
    deploy:new)  cmd_deploy_new "$@" ;;
    status)      cmd_status ;;
    ping)        cmd_ping "$@" ;;
    open)        cmd_open ;;
    logs)        cmd_logs ;;
    -h|--help|help|"")  usage ;;
    *)           die "Unknown command: $cmd. Run './deploy.sh help' for usage." ;;
  esac
}

main "$@"
