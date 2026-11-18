#!/usr/bin/env bash
# ==============================================================================
# Nexus Express — Production Backup & Restore Verification Runbook (TC-090)
#
# Backs up all 12 isolated PostgreSQL 16 databases (port 15432) in custom
# compressed pg_dump format, generates SHA-256 integrity checksums, and
# supports automated restore-drill verification into an isolated temporary DB.
#
# Usage:
#   ./scripts/backup-restore-db.sh backup [--dry-run]
#   ./scripts/backup-restore-db.sh verify-restore <backup_dir> [--dry-run]
# ==============================================================================
set -euo pipefail

ACTION="${1:-backup}"
ARG2="${2:-}"
DRY_RUN="false"
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN="true"
  fi
done

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-15432}"
PG_USER="${PG_USER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
export PGPASSWORD

BACKUP_ROOT="${BACKUP_ROOT:-.tmp/backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

DATABASES=(
  "auth_db"
  "masterdata_db"
  "shipment_db"
  "pickup_db"
  "dispatch_db"
  "manifest_db"
  "scan_db"
  "delivery_db"
  "tracking_db"
  "reporting_db"
  "payment_db"
  "chat_db"
)

log() {
  echo "[$(date -u +%H:%M:%S)] $*"
}

cmd_backup() {
  local out_dir="${BACKUP_ROOT}/${TIMESTAMP}"
  log "Action: BACKUP | DBs=${#DATABASES[@]} | Target=${out_dir} | DryRun=${DRY_RUN}"

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[DRY-RUN] Would create ${out_dir} and dump ${#DATABASES[@]} PostgreSQL databases:"
    printf '  - %s\n' "${DATABASES[@]}"
    log "[DRY-RUN] Would compute SHA256SUMS manifest and verify file integrity."
    return 0
  fi

  mkdir -p "${out_dir}"
  local checksum_file="${out_dir}/SHA256SUMS"
  : > "${checksum_file}"

  for db in "${DATABASES[@]}"; do
    local dump_file="${out_dir}/${db}.dump"
    log "Dumping ${db} -> ${dump_file}"
    pg_dump -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" \
      --format=custom --compress=6 --no-owner --no-acl \
      -f "${dump_file}" "${db}"
    shasum -a 256 "${dump_file}" >> "${checksum_file}"
  done

  log "[OK] Backup complete (${#DATABASES[@]} DBs). Checksums written to ${checksum_file}."
}

cmd_verify_restore() {
  local backup_dir="${ARG2}"
  if [[ -z "${backup_dir}" || "${backup_dir}" == "--dry-run" ]]; then
    backup_dir="$(ls -1dt "${BACKUP_ROOT}"/* 2>/dev/null | head -n 1 || true)"
  fi

  log "Action: VERIFY-RESTORE | Source=${backup_dir:-<none>} | DryRun=${DRY_RUN}"
  if [[ "$DRY_RUN" == "true" ]]; then
    log "[DRY-RUN] Would validate SHA256SUMS, restore into temp DB nexus_restore_verify_${TIMESTAMP}, assert table_count > 0, then DROP temp DB."
    return 0
  fi

  if [[ -z "${backup_dir}" || ! -f "${backup_dir}/SHA256SUMS" ]]; then
    echo "[ERROR] Backup directory or SHA256SUMS missing: ${backup_dir}" >&2
    exit 1
  fi

  log "Verifying SHA-256 checksums..."
  shasum -a 256 -c "${backup_dir}/SHA256SUMS"

  local sample_dump="${backup_dir}/shipment_db.dump"
  local temp_db="nexus_restore_verify_${TIMESTAMP,,}"

  log "Creating isolated verification DB ${temp_db}..."
  createdb -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" "${temp_db}"
  trap 'dropdb --if-exists -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" "${temp_db}" >/dev/null 2>&1 || true' EXIT

  pg_restore -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" \
    --no-owner --no-acl -d "${temp_db}" "${sample_dump}"

  local table_count
  table_count="$(psql -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" -d "${temp_db}" -tAc \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")"

  if [[ "${table_count}" -lt 1 ]]; then
    echo "[ERROR] Restore verification failed: 0 tables found in ${temp_db}" >&2
    exit 1
  fi

  log "[OK] Restore drill passed: restored ${table_count} public tables into ${temp_db} and cleaned up."
}

case "${ACTION}" in
  backup)
    cmd_backup
    ;;
  verify-restore)
    cmd_verify_restore
    ;;
  *)
    echo "Usage: $0 {backup|verify-restore <dir>} [--dry-run]" >&2
    exit 1
    ;;
esac
