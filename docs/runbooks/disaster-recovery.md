# Runbook: Disaster recovery

Loss of the database, the cluster, or the whole region.

**Targets:** RPO ≤ 5 min (continuous WAL archiving) · RTO ≤ 1 h.

## Preconditions (verified quarterly — see [backup-restore.md](backup-restore.md))

- Infrastructure is reproducible from IaC in a second region.
- PostgreSQL: daily base backup + continuous WAL archive to object storage, encrypted,
  30-day retention.
- Object storage: versioned bucket with cross-region replication.
- Secrets: in the managed store, replicated to the DR region.
- Last-good image SHAs are recorded with every release.

## Procedure

### 1. Declare & freeze

Declare SEV1 ([incident-response.md](incident-response.md)). Stop CI deploys. Put the
status page in maintenance.

### 2. Stand up infrastructure in the DR region

```bash
cd infra/ && terraform workspace select dr && terraform apply
```

Brings up VPC, Postgres instance (empty), Redis, the object-storage replica as primary,
and the cluster.

### 3. Restore PostgreSQL (point-in-time)

Choose the target timestamp = last known-good moment before the loss.

```bash
scripts/restore.sh dr --from-base LATEST --pitr '2027-06-01T09:14:00Z'
```

The script: provisions from the latest base backup → replays WAL to the target → promotes
→ prints the recovered LSN/time. Verify it prints `RECOVERY OK` and the timestamp matches.

### 4. Point storage & secrets

- Promote the replicated bucket to primary (or repoint `STORAGE_ENDPOINT`).
- Confirm secrets resolve in the DR region.

### 5. Deploy last-good images

```bash
export TAG=<last-good-sha>
docker compose -f docker-compose.prod.yml --env-file .env.dr run --rm migrate  # no-op if already at head
# roll worker → api → web
```

### 6. Verify before cutover

- [ ] `GET /ready` → all dependencies `up`.
- [ ] Smoke test ([deploy.md §5](deploy.md)).
- [ ] **Isolation** check: run `isolation.e2e-spec.ts` + `tenant-portal.e2e-spec.ts` +
      `vendor-portal.e2e-spec.ts` against the DR env with seeded probe tenants.
- [ ] **Financial** check: run `statement-reproduction.e2e-spec.ts`; regenerate one real
      client statement for a closed period and diff totals against the last archived PDF.
- [ ] Spot-check row counts (`User`, `Payment`, `Transaction`, `Document`) against the
      last monitoring snapshot; confirm data loss ≤ RPO.

### 7. Cut over

Update DNS to the DR region (low TTL kept in normal operation). Watch error rate and
`/ready` for 30 min. Lift maintenance mode. Announce.

### 8. After

- Rebuild the lost region from IaC; re-establish replication (DR region stays primary
  until a planned, low-traffic failback).
- ADR within 48h: timeline, actual RPO/RTO vs target, gaps, action items.
