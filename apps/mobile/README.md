# @nexahaus/mobile — NexaHaus Connect (Expo)

Owner app + field-staff capture. Expo + Expo Router + TypeScript, sharing
`@nexahaus/types` and `@nexahaus/validation` with the API and web.

## Status

Architecture skeleton (Phase 1): auth (keychain refresh token via
`expo-secure-store`, in-memory access token, silent refresh-and-retry), theming,
and the first two screens wired to real API data:

- `app/index.tsx` — splash / auth gate
- `app/login.tsx` — email/phone + password + MFA step
- `app/(app)/dashboard.tsx` — owner portfolio summary (`GET /dashboard/owner`)
- `app/(app)/properties.tsx` — property list (`GET /properties`)

## Full owner screen list (spec §67 — built out in later phases)

1. Splash · 2. Login · 3. Forgot Password · 4. OTP / Verification ·
5. Dashboard · 6. Property List · 7. Property Detail · 8. Property Health ·
9. Maintenance List · 10. Maintenance Detail · 11. Create Maintenance Request ·
12. Inspection List · 13. Inspection Detail · 14. Finance Dashboard ·
15. Payment History · 16. Statement List · 17. Statement Detail · 18. Documents ·
19. Document Detail · 20. Notifications · 21. Messages · 22. Approvals ·
23. Profile · 24. Settings · 25. Help / Support

Field-staff capture (inspectors, maintenance officers) — photos, videos, notes,
inspection results, with offline draft + sync — lands with Phase 3.

## Run

```bash
pnpm --filter @nexahaus/mobile dev
```

`app.json > extra.apiUrl` points the client at the API (default
`http://localhost:4000`). On a device, set it to your machine's LAN address.
