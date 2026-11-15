#!/usr/bin/env bash
# Brings the nginx settings of an existing server up to date (run as root; safe to run again):
#   - HTTP/2 on the HTTPS site: browsers fetch the shop's files in parallel (much faster on phones)
#   - the latest security headers (deploy/nginx/diagon-security-headers.conf)
#
#   sudo bash /var/www/diagon-store/deploy/update-web-server.sh
#
# enable-https.sh runs this automatically; servers set up earlier need it once.
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/var/www/diagon-store}"
SITE_CONF=/etc/nginx/sites-available/diagon-store
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
[[ -f "$SITE_CONF" ]] || { echo "No nginx site at $SITE_CONF: run deploy/setup-vps.sh first." >&2; exit 1; }

backup="/root/diagon-store-nginx.$(date +%s).bak"
cp -p "$SITE_CONF" "$backup"
cp -p /etc/nginx/snippets/diagon-security-headers.conf "$backup.headers" 2>/dev/null || true
restore() {
  echo "✖ nginx didn't accept the change; previous settings restored." >&2
  cp -p "$backup" "$SITE_CONF"
  [[ -f "$backup.headers" ]] && cp -p "$backup.headers" /etc/nginx/snippets/diagon-security-headers.conf
  nginx -t && systemctl reload nginx
  exit 1
}

install -m 644 "$APP_DIR/deploy/nginx/diagon-security-headers.conf" /etc/nginx/snippets/diagon-security-headers.conf

if grep -qE 'listen .*443 ssl' "$SITE_CONF"; then
  version=$(nginx -v 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n 1)
  if grep -qE '^\s*http2 on;|443 ssl http2' "$SITE_CONF"; then
    echo "HTTP/2 is already on"
  elif [[ "$(printf '%s\n1.25.1\n' "$version" | sort -V | head -n 1)" == "1.25.1" ]]; then
    # nginx 1.25.1+ (Ubuntu 26.04): a separate directive after the first "listen 443 ssl" line
    sed -i -E '0,/^(\s*)listen (\[::\]:)?443 ssl.*$/s//&\n\1http2 on;/' "$SITE_CONF"
    echo "HTTP/2 turned on (nginx $version)"
  else
    # older nginx (Ubuntu 24.04): part of the listen line
    sed -i -E 's/(listen (\[::\]:)?443 ssl)( |;)/\1 http2\3/' "$SITE_CONF"
    echo "HTTP/2 turned on (nginx $version)"
  fi
else
  echo "HTTPS isn't set up yet (run enable-https.sh); HTTP/2 needs HTTPS"
fi

nginx -t 2>/dev/null || restore
systemctl reload nginx
rm -f "$backup" "$backup.headers"
echo "✔ web server settings updated"
