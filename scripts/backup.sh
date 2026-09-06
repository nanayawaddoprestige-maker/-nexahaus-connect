#!/usr/bin/env bash
# NexaHaus Connect — encrypted PostgreSQL snapshot.
#
#   scripts/backup.sh <env> <label>
#   scripts/backup.sh production pre-deploy-1a2b3c
#
# Continuous WAL archiving (PITR, RPO <= 5 min) is configured on the database
# server and is independent of this script. This produces a portable, encrypted
# base snapshot for deploys, incidents and the quarterly restore drill.
#
# Requires: pg_dump (v16), openssl, and an object-store CLI (aws or mc).
# Reads:
#   DATABASE_URL           postgres connection string of the target
#   BACKUP_BUCKET          s3://bucket  (or  mc alias/bucket)
#   BACKUP_AGE_RECIPIENT   optional: age recipient; if unset, uses
#   BACKUP_ENC_KEY         32+ char symmetric key for openssl enc (aes-256)
set -euo pipefail

ENV="${1:?usage: backup.sh <env> <label>}"
LABEL="${2:?usage: backup.sh <env> <label>}"
: "${DATABASE_URL:?DATABASE_URL not set}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET not set}"

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
BASENAME="${TS}-${LABEL}"
DUMP="$WORK/${BASENAME}.dump"
ENC="$WORK/${BASENAME}.dump.enc"
META="$WORK/${BASENAME}.meta.json"

echo ">> pg_dump ($ENV) ..."
pg_dump --dbname="$DATABASE_URL" --format=custom --compress=9 --no-owner --no-privileges --file="$DUMP"

# Record the WAL position + a few row counts so a restore can be sanity-checked.
LSN="$(psql "$DATABASE_URL" -tAc 'SELECT pg_current_wal_lsn();' || echo unknown)"
counts="$(psql "$DATABASE_URL" -tAc \
  "SELECT json_build_object(
      'User',(SELECT count(*) FROM \"User\"),
      'Payment',(SELECT count(*) FROM \"Payment\"),
      'Transaction',(SELECT count(*) FROM \"Transaction\"),
      'Document',(SELECT count(*) FROM \"Document\"));" || echo '{}')"

cat > "$META" <<JSON
{
  "env": "${ENV}",
  "label": "${LABEL}",
  "takenAt": "${TS}",
  "walLsn": "${LSN}",
  "imageSha": "${APP_RELEASE:-unknown}",
  "rowCounts": ${counts:-null}
}
JSON

echo ">> encrypt ..."
if [[ -n "${BACKUP_AGE_RECIPIENT:-}" ]] && command -v age >/dev/null; then
  age -r "$BACKUP_AGE_RECIPIENT" -o "$ENC" "$DUMP"
else
  : "${BACKUP_ENC_KEY:?set BACKUP_ENC_KEY or BACKUP_AGE_RECIPIENT}"
  openssl enc -aes-256-cbc -pbkdf2 -salt -in "$DUMP" -out "$ENC" -pass "pass:${BACKUP_ENC_KEY}"
fi

DEST="${BACKUP_BUCKET%/}/${ENV}/${BASENAME}.dump.enc"
META_DEST="${BACKUP_BUCKET%/}/${ENV}/${BASENAME}.meta.json"
echo ">> upload -> $DEST"
if command -v aws >/dev/null && [[ "$BACKUP_BUCKET" == s3://* ]]; then
  aws s3 cp "$ENC" "$DEST" --only-show-errors
  aws s3 cp "$META" "$META_DEST" --only-show-errors
elif command -v mc >/dev/null; then
  mc cp "$ENC" "$DEST"
  mc cp "$META" "$META_DEST"
else
  echo "!! no aws/mc CLI found" >&2; exit 3
fi

echo "OK ${DEST}"
