# Runbook: Backup & restore

## What is protected

| Asset                            | Method                                                                              | Retention                                                        | RPO / RTO               |
| -------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------- |
| PostgreSQL                       | Daily base backup + continuous WAL archive (PITR). Encrypted at rest + in transit.  | 30 days (financial/audit rows also covered by `RetentionPolicy`) | RPO ≤ 5 min · RTO ≤ 1 h |
| Object storage (documents, PDFs) | Versioned bucket + cross-region replication; lifecycle keeps prior versions 90 days | 90 days of versions                                              | RPO ≈ 0                 |
| Secrets                          | Managed secrets store, versioned; rotation runbook                                  | n/a                                                              | n/a                     |
| IaC / config                     | Git                                                                                 | forever                                                          | n/a                     |

Redis holds only cache + queue state and is **not** backed up; it rebuilds from Postgres.

## Take a backup

```bash
scripts/backup.sh <env> <label>
# e.g. scripts/backup.sh production pre-deploy-1a2b3c
```

The script runs `pg_dump` (custom format, compressed) for a portable snapshot, records the
current WAL position, encrypts with the backup key, uploads to
`s3://<backup-bucket>/<env>/<UTC-timestamp>-<label>.dump.enc`, writes a sidecar
`.meta.json` (env, SHA of the running image, LSN, row counts for `User`/`Payment`/
`Transaction`/`Document`), and prints `OK <object-url>`. Continuous WAL archiving is
independent and always on.

## Restore

> A restore is destructive to the target. Never target `production` except during a
> declared incident with IC approval.

```bash
# Full restore of the latest snapshot into a scratch env:
scripts/restore.sh staging --from-base LATEST

# Point-in-time (base backup + WAL replay to an instant):
scripts/restore.sh dr --from-base LATEST --pitr '2027-06-01T09:14:00Z'

# Restore a specific labelled dump:
scripts/restore.sh scratch --object s3://<backup-bucket>/production/2027-05-31T02:00:00Z-nightly.dump.enc
```

The script refuses to run if `DATABASE_URL` host matches the production host unless
`--i-understand-this-is-production` is passed. On success it prints `RECOVERY OK` with the
recovered timestamp/LSN and the sidecar row counts for comparison.

## Quarterly restore drill (required — DEPLOYMENT.md §8)

1. `scripts/restore.sh scratch --from-base LATEST` into a throwaway environment.
2. Run migrations to head (`prisma migrate deploy`) — expect "No pending migrations".
3. Boot the API against it; `GET /ready` → all `up`.
4. Run `statement-reproduction.e2e-spec.ts` **and** regenerate one real closed-period
   client statement; diff the totals against the archived PDF for that period.
5. Run the isolation suite (`isolation`, `tenant-portal`, `vendor-portal`).
6. Record in the drill log: date, snapshot timestamp, measured restore time vs RTO,
   data delta vs RPO, pass/fail, follow-ups. Tear down the scratch env.
