# Runbook: Incident response

For a suspected outage, data exposure, financial discrepancy, or abuse.

## Severity

| Sev | Definition | Response |
|---|---|---|
| **SEV1** | Data exposure / integrity loss, funds mis-recorded, full outage | Page on-call + IC + eng lead now; status page; 30-min updates |
| **SEV2** | Partial outage, one tenant blocked, degraded auth/payments | Page on-call; 60-min updates |
| **SEV3** | Elevated errors, single non-critical feature down | Business hours; ticket |

## First 15 minutes

1. **Declare.** Post in `#nexahaus-ops`: `INCIDENT SEVn <one line> IC:@you`. Open a doc.
2. **Assess blast radius** from dashboards: error rate by route, `/ready` per dependency,
   queue depth, DB connections/CPU, failed-login and webhook-signature-failure counters.
3. **Snapshot evidence** before mutating anything:
   ```bash
   scripts/backup.sh production incident-$(date +%Y%m%dT%H%M%SZ)
   ```
   Export the relevant `AuditLog` / `DocumentAccessLog` / `PaymentProviderWebhookEvent`
   rows for the affected window.

## Contain (pick what applies)

| Symptom | Action |
|---|---|
| Compromised / leaked credential or token | Revoke the user's sessions (`POST /auth/sessions/revoke-all` as admin, or `Session` update `revokedAt=now()` for the user); force password reset. |
| Suspected key compromise (JWT / webhook / storage) | Rotate the secret in the secrets store; roll `api` + `worker`; old refresh tokens die on rotation, old webhook signatures rejected. |
| Malicious document | Set the `Document` to `QUARANTINED`; presigned minting refuses non-`CLEAN`. |
| Payment webhook abuse | Confirm HMAC failures in `PaymentProviderWebhookEvent`; block the source at the edge/WAF; signature check already drops them (400, nothing written). |
| Bad deploy | [deploy.md](deploy.md) → Rollback. |
| DB primary down / corrupt | [disaster-recovery.md](disaster-recovery.md). |
| Runaway load | Scale `api`/`worker` replicas; lower `RATE_LIMIT_MAX` via config; shed at the edge. |

## Eradicate & recover

- Fix forward with a reviewed change through CI, or roll back.
- Verify with the smoke test ([deploy.md §5](deploy.md)) plus a targeted check for the
  failure (e.g. `statement-reproduction` for a financial discrepancy).
- Reconcile money issues from the `Transaction` ledger only — never hand-edit totals;
  post a reversal/adjustment transaction, audited.

## After

- Data-subject impact: assess via `AuditLog` + `DocumentAccessLog`. If personal data was
  exposed, follow the **Ghana Data Protection Act 843** notification obligations in
  [COMPLIANCE.md](../COMPLIANCE.md) — notify the Data Protection Commission and affected
  individuals without undue delay.
- Blameless post-incident review within 48h; ADR under `docs/adr/` with timeline, root
  cause, and action items (each with an owner and a date).
