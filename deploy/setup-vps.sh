#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 VPS for the Diagon Store.
#
#   curl -fsSL https://raw.githubusercontent.com/Nodemor/diagon-store/main/deploy/setup-vps.sh -o setup-vps.sh
#   sudo bash setup-vps.sh                         # shop on http://<server IP>
#   sudo bash setup-vps.sh --domain yourdomain.lk --email you@example.com   # with HTTPS
#   add --demo to load the demo products and photos
#
# Installs nginx, MariaDB, Node.js 24, firewall + fail2ban; creates the app user, database and secrets;
# deploys the shop; turns on auto-deploy (every minute, after GitHub Actions passes) and nightly backups;
# then asks you for the first back-office admin. Safe to run again: existing settings are kept.
set -Eeuo pipefail

REPO_URL="https://github.com/Nodemor/diagon-store.git"
BRANCH="main"
APP_DIR="/var/www/diagon-store"
DATA_DIR="/var/lib/diagon-store"
APP_USER="diagon"
DB_NAME="diagon_store"
DB_USER="diagon"
NODE_MAJOR=24
DOMAIN=""
EMAIL=""
DEMO=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --email) EMAIL="${2:-}"; shift 2 ;;
    --demo) DEMO=true; shift ;;
    --repo) REPO_URL="${2:-}"; shift 2 ;;
    --branch) BRANCH="${2:-}"; shift 2 ;;
    -h | --help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

say() { printf '\n\033[1;33m▸ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✖ %s\033[0m\n\n' "$*" >&2; exit 1; }
as_app() { sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && $1"; }
trap 'die "Setup stopped at line $LINENO. Fix the problem above and run the script again (it is safe to re-run)."' ERR

[[ $EUID -eq 0 ]] || die "Run with sudo: sudo bash $0"
# commands run as the app user can't use root's current folder (e.g. /root)
cd /
# shellcheck disable=SC1091
. /etc/os-release
[[ "${ID:-}" == "ubuntu" ]] || die "This script is for Ubuntu (found ${PRETTY_NAME:-unknown})."
[[ "${VERSION_ID:-}" == "24.04" ]] || echo "Note: made for Ubuntu 24.04, this is ${VERSION_ID:-?}. Continuing."

# ---------------------------------------------------------------------------------------------
say "System packages (this takes a few minutes)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
[[ "${SKIP_UPGRADE:-0}" == 1 ]] || apt-get -y -q -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold upgrade
apt-get -y -q install ca-certificates curl git gnupg openssl nginx mariadb-server ufw fail2ban \
  certbot python3-certbot-nginx unattended-upgrades
timedatectl set-timezone Asia/Colombo || true

if [[ -z "$(swapon --show --noheadings 2>/dev/null)" ]] && (($(awk '/MemTotal/{print $2}' /proc/meminfo) < 4000000)); then
  say "Adding 2 GB swap (helps the shop build on small servers)"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

if ! node -v 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
  say "Node.js ${NODE_MAJOR}"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource_setup.sh
  bash /tmp/nodesource_setup.sh >/dev/null
  apt-get -y -q install nodejs
fi
echo "node $(node -v), npm $(npm -v)"

# ---------------------------------------------------------------------------------------------
say "Firewall (SSH, HTTP, HTTPS) and fail2ban"
for port in $(sshd -T 2>/dev/null | awk '/^port /{print $2}' || true); do ufw allow "${port}/tcp" >/dev/null; done
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban >/dev/null
ufw status | sed -n '1,12p'

# ---------------------------------------------------------------------------------------------
say "App user and folders"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$DATA_DIR" --shell /bin/bash "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" -m 755 "$DATA_DIR" "$DATA_DIR/uploads" "$DATA_DIR/deploy"
install -d -m 755 /var/www
install -d -m 700 /var/backups/diagon-store
# which branch auto-deploy follows (main unless --branch was given)
echo "BRANCH=$BRANCH" >"$DATA_DIR/deploy/config"
chown "$APP_USER:$APP_USER" "$DATA_DIR/deploy/config"

if [[ ! -d "$APP_DIR/.git" ]]; then
  say "Downloading the code from $REPO_URL"
  install -d -o "$APP_USER" -g "$APP_USER" -m 755 "$APP_DIR"
  sudo -u "$APP_USER" -H git clone --quiet --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

# ---------------------------------------------------------------------------------------------
say "Database"
systemctl enable --now mariadb >/dev/null
mysql -e "DROP USER IF EXISTS ''@'localhost'; DROP DATABASE IF EXISTS test;" 2>/dev/null || true

PUBLIC_IP=$(hostname -I | awk '{print $1}')
SITE="http://$PUBLIC_IP"
BACKEND_ENV="$APP_DIR/backend/.env"
if [[ ! -f "$BACKEND_ENV" ]]; then
  DB_PASS=$(openssl rand -hex 24)
  mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
ALTER USER '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
  umask 077
  cat >"$BACKEND_ENV" <<ENV
# Diagon Store API settings on this server (created by deploy/setup-vps.sh). Never commit this file.
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
DATABASE_URL=mysql://$DB_USER:$DB_PASS@127.0.0.1:3306/$DB_NAME
# signs admin sessions; changing it signs every admin out
JWT_SECRET=$(openssl rand -hex 48)
JWT_EXPIRES_IN=8h
# the shop's public address (deploy/enable-https.sh switches these to https://yourdomain)
CLIENT_URL=$SITE
SITE_URL=$SITE
API_PUBLIC_URL=$SITE
# true once the site is on HTTPS (admin sign-in only works over HTTPS when true)
COOKIE_SECURE=false
# uploaded photos live outside the code folder, so deploys never touch them
UPLOAD_DIR=$DATA_DIR/uploads
MAX_UPLOAD_SIZE_MB=5
STORE_NAME=Diagon Store
STORE_CURRENCY=LKR
# the WhatsApp number is set in Back office → Settings
SHOP_WHATSAPP_NUMBER=
# order emails: set EMAIL_ENABLED=true and the SMTP_* settings from backend/.env.example
EMAIL_ENABLED=false
ENV
  umask 022
  chown "$APP_USER:$APP_USER" "$BACKEND_ENV"
  chmod 600 "$BACKEND_ENV"
  echo "created $BACKEND_ENV (database password and session secret generated)"
else
  echo "keeping existing $BACKEND_ENV"
fi

FRONTEND_ENV="$APP_DIR/frontend/.env"
if [[ ! -f "$FRONTEND_ENV" ]]; then
  ADMIN_SEGMENT=$(node -e 'const a="abcdefghjkmnpqrstuvwxyz23456789";console.log("door-"+[...require("crypto").randomBytes(18)].map((b)=>a[b%a.length]).join(""))')
  ADMIN_HASH=$(printf '%s' "$ADMIN_SEGMENT" | sha256sum | cut -d' ' -f1)
  cat >"$FRONTEND_ENV" <<ENV
# Shop build settings on this server (created by deploy/setup-vps.sh)
VITE_API_URL=/api
# hash of the secret back-office address (the address itself is in /root/diagon-store-admin-address.txt)
VITE_ADMIN_PATH_HASH=$ADMIN_HASH
ENV
  chown "$APP_USER:$APP_USER" "$FRONTEND_ENV"
  (umask 077 && printf 'Diagon Store back-office address (keep private):\n%s/%s\n' "$SITE" "$ADMIN_SEGMENT" >/root/diagon-store-admin-address.txt)
  echo "secret back-office address created"
fi

# ---------------------------------------------------------------------------------------------
say "Services"
install -m 644 "$APP_DIR"/deploy/systemd/diagon-store*.service "$APP_DIR"/deploy/systemd/diagon-store*.timer /etc/systemd/system/
cat >/etc/sudoers.d/diagon-store <<'SUDO'
# the deploy script (running as diagon) may restart the shop's API, nothing else
diagon ALL=(root) NOPASSWD: /usr/bin/systemctl restart diagon-store
SUDO
chmod 440 /etc/sudoers.d/diagon-store
visudo -cf /etc/sudoers.d/diagon-store >/dev/null
systemctl daemon-reload
systemctl enable diagon-store >/dev/null

say "Building and starting the shop (first deploy)"
as_app "bash deploy/deploy.sh"

if [[ "$DEMO" == true ]]; then
  say "Demo products and photos"
  as_app "cd backend && node prisma/seed.js && node scripts/localize-images.js"
fi

# ---------------------------------------------------------------------------------------------
say "Web server (nginx)"
install -m 644 "$APP_DIR/deploy/nginx/diagon-security-headers.conf" /etc/nginx/snippets/diagon-security-headers.conf
if [[ ! -f /etc/nginx/sites-available/diagon-store ]]; then
  sed -e "s|__SERVER_NAME__|_|" -e "s|__APP_DIR__|$APP_DIR|" "$APP_DIR/deploy/nginx/diagon-store.conf" >/etc/nginx/sites-available/diagon-store
fi
ln -sf /etc/nginx/sites-available/diagon-store /etc/nginx/sites-enabled/diagon-store
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx >/dev/null
systemctl reload-or-restart nginx

say "Auto-deploy and nightly backups"
systemctl enable --now diagon-store-deploy.timer diagon-store-backup.timer >/dev/null

if [[ -n "$DOMAIN" ]]; then
  say "HTTPS for $DOMAIN"
  bash "$APP_DIR/deploy/enable-https.sh" "$DOMAIN" "$EMAIL" || echo "HTTPS isn't set up yet. Point the domain here, then run: sudo bash $APP_DIR/deploy/enable-https.sh $DOMAIN $EMAIL"
fi

# ---------------------------------------------------------------------------------------------
admins=$(mysql -N -e "SELECT COUNT(*) FROM \`$DB_NAME\`.\`Admin\`" 2>/dev/null || echo 0)
if [[ "$admins" == "0" ]]; then
  if [[ -t 0 ]]; then
    say "First back-office admin"
    as_app "cd backend && node create-admin.js"
  else
    echo "Create the first admin later: sudo -u diagon -H bash -c 'cd $APP_DIR/backend && node create-admin.js'"
  fi
fi

trap - ERR
SITE_NOW=$(grep -E '^SITE_URL=' "$BACKEND_ENV" | cut -d= -f2)
ADMIN_SEGMENT=$(grep -oE 'door-[a-z0-9]+' /root/diagon-store-admin-address.txt 2>/dev/null | head -1 || true)
cat <<DONE

$(printf '\033[1;32m✔ Diagon Store is running\033[0m')

  Shop          $SITE_NOW
  Back office   $SITE_NOW/${ADMIN_SEGMENT:-admin}   (keep this private; also in /root/diagon-store-admin-address.txt)
  Auto-deploy   every merge to main is deployed within a few minutes after GitHub Actions passes
                log: /var/lib/diagon-store/deploy/deploy.log    status: systemctl list-timers diagon-store*
  Backups       nightly at 02:30 to /var/backups/diagon-store (keep copies off the server too)
  Photos        $DATA_DIR/uploads

DONE
if [[ "$(grep -E '^COOKIE_SECURE=' "$BACKEND_ENV" | cut -d= -f2)" != "true" ]]; then
  cat <<NOTE
  Next: point your domain to $PUBLIC_IP and turn on HTTPS:
        sudo bash $APP_DIR/deploy/enable-https.sh yourdomain.lk you@example.com
  (Until then the shop runs on plain http — fine for a first look, not for real customers.)

NOTE
fi
