#!/usr/bin/env bash
# Puts the shop on your domain with a free HTTPS certificate (Let's Encrypt, renewed automatically).
#
#   sudo bash /var/www/diagon-store/deploy/enable-https.sh yourdomain.lk you@example.com
#
# First point the domain's DNS "A" record (and "www", if you want it) to this server's IP address
# and wait until it resolves. The email is used by Let's Encrypt for expiry warnings (optional).
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/var/www/diagon-store}"
SITE_CONF=/etc/nginx/sites-available/diagon-store
DOMAIN="${1:-}"
EMAIL="${2:-}"

die() { echo -e "\n✖ $*\n" >&2; exit 1; }
[[ $EUID -eq 0 ]] || die "Run with sudo."
[[ -n "$DOMAIN" ]] || die "Usage: sudo bash $0 yourdomain.lk [you@example.com]"
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"; DOMAIN="${DOMAIN,,}"
[[ "$DOMAIN" =~ ^[a-z0-9.-]+\.[a-z]{2,}$ ]] || die "\"$DOMAIN\" doesn't look like a domain name."

set_env() { # set_env KEY VALUE FILE
  if grep -qE "^$1=" "$3"; then sed -i "s|^$1=.*|$1=$2|" "$3"; else echo "$1=$2" >>"$3"; fi
}

# the domain must already point here, or the certificate request fails
my_ips=" $(hostname -I) "
names=("$DOMAIN")
domain_ip=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}')
[[ -n "$domain_ip" ]] || die "$DOMAIN doesn't resolve yet. Add an A record pointing to $(hostname -I | awk '{print $1}') and try again in a few minutes."
[[ "$my_ips" == *" $domain_ip "* ]] || die "$DOMAIN points to $domain_ip, but this server is$my_ips. Update the A record and try again."
www_ip=$(getent ahostsv4 "www.$DOMAIN" | awk 'NR==1{print $1}' || true)
[[ -n "$www_ip" && "$my_ips" == *" $www_ip "* ]] && names+=("www.$DOMAIN")

echo "▸ nginx: ${names[*]}"
sed -i "0,/server_name .*;/s//server_name ${names[*]};/" "$SITE_CONF"
nginx -t
systemctl reload nginx

echo "▸ HTTPS certificate"
cert_args=(--nginx --non-interactive --agree-tos --redirect)
if [[ -n "$EMAIL" ]]; then cert_args+=(-m "$EMAIL"); else cert_args+=(--register-unsafely-without-email); fi
for n in "${names[@]}"; do cert_args+=(-d "$n"); done
certbot "${cert_args[@]}"

echo "▸ shop settings"
env_file="$APP_DIR/backend/.env"
origins="https://$DOMAIN"
[[ " ${names[*]} " == *" www.$DOMAIN "* ]] && origins+=",https://www.$DOMAIN"
set_env CLIENT_URL "$origins" "$env_file"
set_env SITE_URL "https://$DOMAIN" "$env_file"
set_env API_PUBLIC_URL "https://$DOMAIN" "$env_file"
set_env COOKIE_SECURE true "$env_file"
systemctl restart diagon-store

echo -e "\n✔ The shop is live at https://$DOMAIN (certificates renew automatically)."
[[ -f /root/diagon-store-admin-address.txt ]] &&
  echo "  Back office: https://$DOMAIN/$(grep -oE 'door-[a-z0-9]+' /root/diagon-store-admin-address.txt | head -1)"
exit 0
