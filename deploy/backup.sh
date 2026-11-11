#!/bin/sh
# Daily backup of the database and the uploaded images. Keeps the last 14 days.
# Cron (as the deploy user):  30 3 * * * /home/deploy/Pagina-WEB/deploy/backup.sh >> /home/deploy/backup.log 2>&1
set -eu
cd "$(dirname "$0")/.."
DIR="${BACKUP_DIR:-deploy/backups}"
STAMP="$(date +%Y%m%d-%H%M)"
mkdir -p "$DIR"
COMPOSE="docker compose ${COMPOSE_ARGS:--f docker-compose.prod.yml --env-file deploy/.env.production}"

$COMPOSE exec -T postgres pg_dump -U postgres -Fc mantenimientos > "$DIR/db-$STAMP.dump"
$COMPOSE run --rm --no-deps -T --entrypoint tar api czf - -C /data uploads > "$DIR/uploads-$STAMP.tar.gz"

find "$DIR" -type f -mtime +14 -delete
echo "Backup OK $STAMP"
