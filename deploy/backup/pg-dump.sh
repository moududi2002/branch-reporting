#!/usr/bin/env bash
# deploy/backup/pg-dump.sh
set -euo pipefail

BACKUP_DIR="/var/backups/branch-reporting"
DB_NAME="${DB_NAME:-branch_reporting}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS=30
ARCHIVE_DIR="$BACKUP_DIR/archive"

mkdir -p "$BACKUP_DIR" "$ARCHIVE_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/${DB_NAME}-${STAMP}.sql.gz"

pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"
chmod 600 "$FILE"

# Weekly archive: keep one Sunday snapshot separately
if [ "$(date +%u)" = "7" ]; then
  cp "$FILE" "$ARCHIVE_DIR/"
fi

# Retention: delete dumps older than RETENTION_DAYS
find "$BACKUP_DIR" -maxdepth 1 -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup written: $FILE"