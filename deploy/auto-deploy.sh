#!/usr/bin/env bash
# Auto-deploy: run every minute by diagon-store-deploy.timer (as the diagon user).
#
# 1. Asks GitHub for the newest commit on main (git ls-remote — no login needed for a public repo).
# 2. Waits until that commit's GitHub Actions checks (CI: tests, lint, build) have finished.
# 3. Deploys it with deploy.sh when they passed; skips it (once) when they failed.
#
# Pause auto-deploy:   sudo systemctl stop diagon-store-deploy.timer
# Resume:              sudo systemctl start diagon-store-deploy.timer
# Deploy without CI:   REQUIRE_CI=0 in /var/lib/diagon-store/deploy/config (not recommended)
set -Eeuo pipefail

main() {
  local APP_DIR="${APP_DIR:-/var/www/diagon-store}"
  local STATE_DIR="${STATE_DIR:-/var/lib/diagon-store/deploy}"
  local BRANCH="${BRANCH:-main}"
  local REQUIRE_CI=1
  mkdir -p "$STATE_DIR"
  # shellcheck disable=SC1091
  [[ -f "$STATE_DIR/config" ]] && source "$STATE_DIR/config"

  cd "$APP_DIR"
  local latest live failed
  latest=$(git ls-remote origin "refs/heads/$BRANCH" | cut -f1)
  [[ "$latest" =~ ^[0-9a-f]{40}$ ]] || { echo "couldn't reach GitHub"; exit 0; }
  live=$(cat "$STATE_DIR/deployed" 2>/dev/null || true)
  failed=$(cat "$STATE_DIR/failed" 2>/dev/null || true)
  [[ "$latest" == "$live" || "$latest" == "$failed" ]] && exit 0

  if [[ "$REQUIRE_CI" == 1 ]]; then
    local repo state
    repo=$(git remote get-url origin | sed -E 's#^(https://|git@)github\.com[:/]##; s#\.git$##')
    state=$(ci_state "$repo" "$latest")
    case "$state" in
      success) ;;
      failure)
        echo "$(date '+%F %T') CI failed for ${latest:0:7} — not deploying it" | tee -a "$STATE_DIR/deploy.log"
        echo "$latest" >"$STATE_DIR/failed"
        exit 0
        ;;
      none)
        # no checks at all: GitHub Actions may be off for this repo. Wait 30 minutes, then deploy anyway.
        local seen="$STATE_DIR/first-seen-$latest"
        [[ -f "$seen" ]] || date +%s >"$seen"
        if (($(date +%s) - $(cat "$seen") < 1800)); then
          echo "waiting for CI on ${latest:0:7} (no checks yet)"
          exit 0
        fi
        echo "$(date '+%F %T') no CI checks for ${latest:0:7} after 30 minutes — deploying anyway" | tee -a "$STATE_DIR/deploy.log"
        ;;
      *)
        echo "waiting for CI on ${latest:0:7} ($state)"
        exit 0
        ;;
    esac
    rm -f "$STATE_DIR"/first-seen-*
  fi

  exec /bin/bash "$APP_DIR/deploy/deploy.sh" "$latest"
}

# success | failure | pending | none — from GitHub's public check-runs API
ci_state() {
  local repo="$1" sha="$2" json
  json=$(curl -fsS --max-time 15 -H "Accept: application/vnd.github+json" -H "User-Agent: diagon-store-deploy" \
    "https://api.github.com/repos/$repo/commits/$sha/check-runs?per_page=100") || { echo "unreachable"; return; }
  node -e '
    const runs = JSON.parse(require("fs").readFileSync(0, "utf8")).check_runs || [];
    const ok = ["success", "skipped", "neutral"];
    let state = "success";
    if (!runs.length) state = "none";
    else if (runs.some((r) => r.status !== "completed")) state = "pending";
    else if (!runs.every((r) => ok.includes(r.conclusion))) state = "failure";
    console.log(state);
  ' <<<"$json"
}

main "$@"
exit
