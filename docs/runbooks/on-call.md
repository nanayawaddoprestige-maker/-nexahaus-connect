# Runbook: On-call

## Rotation

- Weekly, one primary + one secondary. Handoff Monday 10:00 Afric/Accra in `#nexahaus-ops`
  with a note of anything in flight.
- Primary acknowledges pages within 5 min (SEV1/2). Secondary is backup + covers reviews.

## Alerts → first action

| Alert                               | Look at                                         | Likely cause / first move                                                                                       |
| ----------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `api /ready` failing                | `/ready` body per dependency                    | DB or Redis unreachable → check that service; if DB primary down → [disaster-recovery.md](disaster-recovery.md) |
| Error-rate spike (5xx)              | Sentry issues, top failing route, recent deploy | Bad deploy → [deploy.md](deploy.md) Rollback; else scope to a module                                            |
| Latency p95 up                      | DB slow-query log, connection pool, queue depth | Missing index / N+1 → [../PERFORMANCE.md](../PERFORMANCE.md); saturated pool → scale or lower concurrency       |
| Queue backlog (BullMQ depth rising) | `worker` logs, failed jobs, Redis health        | Worker crashed / not scaled → restart, add replicas; poison job → inspect `DomainEvent.lastError`               |
| DB connections near max             | pool metrics, long transactions                 | Scale down `api` replicas or raise pool cautiously; kill stuck txns; check for a migration lock                 |
| Failed-login spike                  | `AuditLog` failed-auth, source IPs              | Credential stuffing → confirm lockout + rate limit holding; block IPs at edge                                   |
| Webhook signature failures          | `PaymentProviderWebhookEvent`                   | Provider secret rotated without us, or an attacker → verify with provider; our side already drops them          |
| Storage errors                      | storage provider status, `STORAGE_*` config     | Provider incident → uploads degrade gracefully; documents stay pending, not lost                                |
| Cert / TLS expiry warning           | edge cert manager                               | Renew; should be automated — file a bug if it wasn't                                                            |

## Useful checks

```bash
curl -fsS https://$ENV.nexahaus.example/ready | jq
# worker queue depth (from a shell with REDIS_URL):
redis-cli -u "$REDIS_URL" --scan --pattern "$QUEUE_PREFIX:*" | head
# recent 5xx correlation ids are in the structured logs; search Sentry by requestId
```

Config that can be changed **without a redeploy** (DB `OrganizationSetting`, `SUPER_ADMIN`):
fees, thresholds, categories, templates, score weights. Rate limits and secrets are env —
those need a config change + roll.

## Escalation

1. Secondary on-call → 2. Engineering lead → 3. CTO.
   SEV1 involving personal data or funds: also notify the Data Protection Officer immediately
   (Act 843 clock starts) and Finance for any money discrepancy.
