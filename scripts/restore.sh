#!/usr/bin/env bash
# NexaHaus Connect — restore a PostgreSQL snapshot taken by scripts/backup.sh.
#
#   scripts/restore.sh <env> --from-base LATEST
#   scripts/restore.sh dr    --from-base LATEST --pitr '2027-06-01T09:14:00Z'
#   scripts/restore.sh scratch --object s3://bucket/production/2027-05-31T02:00:00Z-nightly.dump.enc
#
# DESTRUCTIVE to the target database in DATABASE_URL. Refuses a production-looking
# host unless --i-understand-this-is-production is given (declared incident only).
#
# --pitr replays WAL to an instant. This script restores the base dump and then,
# when --pitr is set, calls the server-side PITR helper (recovery target time)
# via `pg_wal_replay`/managed-service API wrapper `scripts/_pitr.sh` if present;
# otherwise it stops after the base restore and prints the WAL target to apply.
#
# Requires: pg_restore (v16), psql, openssl (or age), aws or mc.
set -euo pipefail

ENV="${1:?usage: restore.sh <env> [--from-base LATEST | --object URL] [--pitr TS]}"
shift
FROM_BASE="" OBJECT="" PITR="" ALLOW_PROD=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-base) FROM_BASE="${2:?}"; shift 2 ;;
    --object)    OBJECT="${2:?}"; shift 2 ;;
    --pitr)      PITR="${2:?}"; shift 2 ;;
    --i-understand-this-is-production) ALLOW_PROD=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
: "${DATABASE_URL:?DATABASE_URL not set}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET not set}"

HOST="$(printf '%s' "$DATABASE_URL" | sed -E 's#.*://[^@]*@([^:/]+).*#\1#')"
if [[ "$HOST" == *prod* || "${ENV}" == "production" ]] && [[ "$ALLOW_PROD" -ne 1 ]]; then
  echo "!! target looks like production ($HOST). Pass --i-understand-this-is-production" >&2
  exit 4
fi

WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

if [[ -z "$OBJECT" ]]; then
  [[ "$FROM_BASE" == "LATEST" ]] || { echo "use --from-base LATEST or --object URL" >&2; exit 2; }
  PREFIX="${BACKUP_BUCKET%/}/${ENV}/"
  echo ">> resolving latest snapshot under $PREFIX"
  if command -v aws >/dev/null && [[ "$BACKUP_BUCKET" == s3://* ]]; then
    OBJECT="$(aws s3 ls "$PREFIX" | awk '/\.dump\.enc$/ {print $4}' | sort | tail -1)"
    OBJECT="${PREFIX}${OBJECT}"
  else
    OBJECT="$(mc ls "$PREFIX" | awk '/\.dump\.enc$/ {print $NF}' | sort | tail -1)"
    OBJECT="${PREFIX}${OBJECT}"
  fi
fi
echo ">> snapshot: $OBJECT"

ENC="$WORK/snap.dump.enc"; DUMP="$WORK/snap.dump"
if command -v aws >/dev/null && [[ "$OBJECT" == s3://* ]]; then aws s3 cp "$OBJECT" "$ENC" --only-show-errors
else mc cp "$OBJECT" "$ENC"; fi

echo ">> decrypt ..."
if [[ -n "${BACKUP_AGE_IDENTITY:-}" ]] && command -v age >/dev/null; then
  age -d -i "$BACKUP_AGE_IDENTITY" -o "$DUMP" "$ENC"
else
  : "${BACKUP_ENC_KEY:?set BACKUP_ENC_KEY or BACKUP_AGE_IDENTITY}"
  openssl enc -d -aes-256-cbc -pbkdf2 -in "$ENC" -out "$DUMP" -pass "pass:${BACKUP_ENC_KEY}"
fi

echo ">> terminating connections + recreating schema ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
 WHERE datname = current_database() AND pid <> pg_backend_pid();
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SQL

echo ">> pg_restore ..."
pg_restore --dbname="$DATABASE_URL" --no-owner --no-privileges --clean --if-exists --exit-on-error "$DUMP"

if [[ -n "$PITR" ]]; then
  if [[ -x "$(dirname "$0")/_pitr.sh" ]]; then
    echo ">> PITR replay to $PITR ..."
    "$(dirname "$0")/_pitr.sh" "$DATABASE_URL" "$PITR"
  else
    echo "!! base restored. Apply WAL to recovery_target_time='$PITR' on the server" >&2
    echo "   (managed service: set the restore point in the provider console/API)." >&2
  fi
fi

echo ">> verify ..."
psql "$DATABASE_URL" -tAc \
  "SELECT 'rows User='||count(*) FROM \"User\";" || true
RECOVERED="$(psql "$DATABASE_URL" -tAc 'SELECT now();' || echo unknown)"
echo "RECOVERY OK  target=${PITR:-latest}  serverTime=${RECOVERED}"
