#!/usr/bin/env bash
# Nightly backup (root, via diagon-store-backup.timer): database dump + uploaded photos, kept 14 days.
#   Run now:     sudo systemctl start diagon-store-backup
#   Files:       /var/backups/diagon-store
#   Restore DB:  gunzip -c db-<date>.sql.gz | sudo mariadb diagon_store
#   Restore photos: sudo tar -xzf uploads-<date>.tar.gz -C /var/lib/diagon-store
# Copy backups off the server regularly (e.g. download them, or sync to cloud storage).
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/var/www/diagon-store}"
DATA_DIR="${DATA_DIR:-/var/lib/diagon-store}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/diagon-store}"
KEEP_DAYS="${KEEP_DAYS:-14}"

umask 077
mkdir -p "$BACKUP_DIR"
stamp=$(date +%F-%H%M)

# database name from DATABASE_URL (mysql://user:pass@host:port/name)
db=$(grep -E '^DATABASE_URL=' "$APP_DIR/backend/.env" | tail -n 1 | sed -E 's#.*/([^/?"]+).*#\1#')
db="${db:-diagon_store}"

mariadb-dump --single-transaction --quick --routines --triggers --default-character-set=utf8mb4 "$db" | gzip -9 >"$BACKUP_DIR/db-$stamp.sql.gz"
tar --exclude="uploads/.cache" -czf "$BACKUP_DIR/uploads-$stamp.tar.gz" -C "$DATA_DIR" uploads

find "$BACKUP_DIR" -type f \( -name 'db-*.sql.gz' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete
echo "backup done: $(du -sh "$BACKUP_DIR" | cut -f1) in $BACKUP_DIR"
