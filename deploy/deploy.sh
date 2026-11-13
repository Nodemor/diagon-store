#!/usr/bin/env bash
# Deploys one commit of the Diagon Store on the VPS:
#   update code → install packages (only when they changed) → database migrations → build the shop
#   → restart the API → health check → switch to the new shop build.
# If the build fails or the new API doesn't start, the previous version is put back.
#
# Usage (on the server):  sudo -u diagon /var/www/diagon-store/deploy/deploy.sh [commit]
# Normally started by auto-deploy.sh when GitHub Actions has passed for a new commit on main.
#
# Note: database migrations can't be undone automatically. Keep them additive (add columns/tables,
# don't drop or rename in the same release that stops using them).
set -Eeuo pipefail

# Everything lives in main() so bash reads the whole script before running it: the script updates itself
# (git reset) while it runs.
main() {
  local APP_DIR="${APP_DIR:-/var/www/diagon-store}"
  local STATE_DIR="${STATE_DIR:-/var/lib/diagon-store/deploy}"
  local BRANCH="${BRANCH:-main}"
  local SERVICE="diagon-store"
  # shellcheck disable=SC1091
  [[ -f "$STATE_DIR/config" ]] && source "$STATE_DIR/config"

  if [[ $(id -u) -eq 0 ]]; then
    echo "Run as the app user:  sudo -u diagon $0 $*" >&2
    exit 1
  fi

  mkdir -p "$STATE_DIR"
  LOG_FILE="$STATE_DIR/deploy.log"
  exec 9>"$STATE_DIR/deploy.lock"
  if ! flock -n 9; then
    log "another deploy is already running"
    exit 0
  fi

  cd "$APP_DIR"
  git fetch --quiet origin "$BRANCH"
  local target="${1:-origin/$BRANCH}"
  if ! target=$(git rev-parse --verify --quiet "${target}^{commit}"); then
    log "unknown commit: ${1:-}"
    exit 1
  fi
  local previous
  previous=$(git rev-parse HEAD)
  local first_deploy=false
  [[ -f "$STATE_DIR/deployed" ]] || first_deploy=true

  if [[ "$target" == "$previous" && "$first_deploy" == false ]]; then
    log "${target:0:7} is already live"
    exit 0
  fi

  log "deploying ${target:0:7} ($(git log -1 --format=%s "$target" | cut -c1-70)) — live was ${previous:0:7}"
  git reset --quiet --hard "$target"

  if ! build "$previous" "$target" "$first_deploy"; then
    log "✖ build failed — keeping ${previous:0:7}"
    git reset --quiet --hard "$previous"
    install_packages "$target" "$previous" false || true # put the old packages back if they changed
    echo "$target" >"$STATE_DIR/failed"
    exit 1
  fi

  sudo -n /usr/bin/systemctl restart "$SERVICE"
  if ! healthy; then
    log "✖ the new version didn't start — going back to ${previous:0:7}"
    git reset --quiet --hard "$previous"
    install_packages "$target" "$previous" false || true
    (cd backend && npx --no-install prisma generate >/dev/null)
    sudo -n /usr/bin/systemctl restart "$SERVICE"
    rm -rf frontend/dist-next
    echo "$target" >"$STATE_DIR/failed"
    healthy && log "previous version is running again" || log "✖ previous version is not healthy either — check: journalctl -u $SERVICE"
    exit 1
  fi

  # the API is up: switch the shop to the new build in one step
  rm -rf frontend/dist-previous
  [[ -d frontend/dist ]] && mv frontend/dist frontend/dist-previous
  mv frontend/dist-next frontend/dist

  echo "$target" >"$STATE_DIR/deployed"
  rm -f "$STATE_DIR/failed"
  log "✔ ${target:0:7} is live"
}

log() {
  local line
  line="$(date '+%F %T') $*"
  echo "$line"
  [[ -n "${LOG_FILE:-}" ]] && echo "$line" >>"$LOG_FILE"
  return 0
}

# npm ci only when the lock file changed (or packages are missing): most deploys skip it
install_packages() {
  local from="$1" to="$2" force="$3"
  if [[ "$force" == true || ! -d backend/node_modules ]] || ! git diff --quiet "$from" "$to" -- backend/package-lock.json; then
    log "installing API packages"
    (cd backend && npm ci --omit=dev --no-audit --no-fund --loglevel=error) || return 1
  fi
  if [[ "$force" == true || ! -d frontend/node_modules ]] || ! git diff --quiet "$from" "$to" -- frontend/package-lock.json; then
    log "installing shop packages"
    (cd frontend && npm ci --no-audit --no-fund --loglevel=error) || return 1
  fi
  return 0
}

build() {
  local previous="$1" target="$2" first_deploy="$3"
  install_packages "$previous" "$target" "$first_deploy" || return 1

  log "database migrations"
  (cd backend && npx --no-install prisma generate >/dev/null && npx --no-install prisma migrate deploy) || return 1

  log "building the shop"
  rm -rf frontend/dist-next
  (cd frontend && npx --no-install vite build --outDir dist-next --emptyOutDir --logLevel warn) || return 1
  [[ -f frontend/dist-next/index.html ]] || return 1
}

healthy() {
  local port
  port=$(grep -E '^PORT=' backend/.env 2>/dev/null | tail -1 | cut -d= -f2 | tr -d '"[:space:]')
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 2 "http://127.0.0.1:${port:-5000}/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

main "$@"
exit
