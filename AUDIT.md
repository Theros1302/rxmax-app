# RxMax — Engineering Audit

Last reviewed by acting Chief Developer Officer. Hand this to whoever is hired to take over the codebase. It's a punch list, not a complaint sheet.

## Severity legend
- **P0** — exploitable in <1 hour with public information. Fix before any external user.
- **P1** — would cause an outage or compliance breach within 30 days of launch.
- **P2** — bugs and rough edges visible to users. Fix when convenient.

## P0 — Fixed in Batch 4

- [x] JWT secret no longer falls back to a public string. Backend refuses to start in production if `JWT_SECRET` is missing or weak (`backend/src/middleware/auth.js`).
- [x] Demo OTP `123456` is gated behind `NODE_ENV !== 'production'`. Real OTP path required in prod.
- [x] OTP plaintext no longer logged in production. Phone numbers are partially masked in logs.
- [x] `/api/medicines/seed` and `/api/medicines/seed-bulk` now require admin authentication; in-code secret check is dead.
- [x] CORS now uses an explicit allowlist of `*.vercel.app`, `*.pages.dev`, `*.rxmax.online`, `*.onrender.com`, and localhost.
- [x] Rate-limit middleware: `/api/auth/*` capped at 10 req/min/IP; `/api/*` at 120 req/min/IP. Stops credential stuffing.
- [x] `/uploads/*` now authenticated. Only the patient who owns the Rx, the linked store, or an admin can fetch files.
- [x] bcrypt cost factor raised from 10 to 12.
- [x] Helmet enabled (X-Frame-Options, HSTS, X-Content-Type-Options, etc.).
- [x] Body-size limit reduced from 20 MB to 256 KB by default; only `/api/prescriptions/*` keeps a higher 15 MB limit.
- [x] `local-server/` admin login (still hardcoded) — flagged. Recommend deleting `local-server/` from production repo entirely (it's a dev-only mock backend).

## P1 — Partial / pending

- [x] Structured request logging via morgan (combined format in prod, dev format locally).
- [x] `withTransaction` helper added in `backend/src/models/index.js`. **Not yet applied** to multi-step write flows. Apply to: `POST /api/orders`, `POST /api/stores/inventory/bulk`, store registration.
- [ ] Refresh token flow. JWT lifetime now reduced to 7 days (was 30). Implement refresh-token rotation when you can.
- [ ] No environment separation. Add a `staging` branch with its own Render service + Vercel preview. ~2 hours of dashboard work, no code change.
- [ ] No automated tests. Stub Jest + supertest. Critical paths: store login, patient OTP+register, place order, send reminder, admin create store.
- [ ] node-cron runs in-process. Move to Render Cron Jobs OR add `last_run_at` idempotency tokens per cron.
- [ ] Multer writes to ephemeral Render disk. Switch prescription image storage to S3/Cloudflare R2/GCS. ~3 hours.
- [ ] No dependency security scanning. Enable Dependabot on the GitHub repo.
- [ ] No DB backup beyond Render's defaults. Schedule nightly `pg_dump` to S3. Test restore monthly.

## P2 — Pending

- [x] DPDP Act consent checkbox in patient registration (`patient-app/src/pages/RegisterPage.js`).
- [x] Legacy `medibuddy_token` localStorage key migrated to `rxmax_store_token`.
- [ ] Patient app `OrderDetailPage` shows fake hardcoded timeline progression. Should reflect actual `order.status` field.
- [ ] No loading skeletons; pages show "Loading…" text. Replace with skeleton placeholders.
- [ ] `patient-app/src/services/api.js`'s `searchMedicines` falls back to local hardcoded `fallbackMedicines`. Should only show the connected store's `store_inventory`.
- [ ] No CAPTCHA on Formspree-backed lead form on the marketing site. Add hCaptcha or Cloudflare Turnstile (both free).
- [ ] Old documentation files still in repo: `BUILD_SUMMARY.md`, `FILE_MANIFEST.md`, `START_HERE.md`, `IMPLEMENTATION_SUMMARY.md`. Either archive in `docs/legacy/` or delete.
- [ ] No TypeScript. Schedule a multi-week migration; prioritize shared types between backend and frontend.
- [ ] Three frontend apps share zero code. Plan monorepo refactor with `packages/ui` + `packages/api-client`.

## Compliance — Pending

- [x] Explicit DPDP consent capture in patient onboarding.
- [ ] "Right to erasure" workflow. Patient should be able to request data deletion through the app. Required by DPDP §6.
- [ ] Audit log of admin access to patient records. Add `audit_log` table, log every admin read of patient data.
- [ ] Drug License (DL) verification. Currently any string accepted as `license_number`. Integrate with state DCD or manual review queue before activating new stores.
- [ ] Prescription image retention policy. Indian law: retain 2 years. Current policy: undefined. Add `expires_at` column + scheduled cleanup.

## Required env vars on Render production

| Key | Required? | Notes |
|---|---|---|
| `NODE_ENV` | yes | must be `production` |
| `JWT_SECRET` | yes | 32+ random chars; backend refuses to start without |
| `DATABASE_URL` | yes | auto-set by Render blueprint when DB is attached |
| `PORT` | yes | Render sets to `10000` automatically |
| `GEMINI_API_KEY` | optional | enables AI Rx OCR; otherwise demo mode |
| `WHATSAPP_API_KEY` | optional | enables WhatsApp send; otherwise mock |

## Test commands for the new dev

```bash
# Backend boot test
cd backend && npm install && JWT_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))') npm start

# Hit health
curl https://rxmax-backend.onrender.com/api/health

# Auth rate-limit test (should 429 by 11th request)
for i in 1 2 3 4 5 6 7 8 9 10 11; do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://rxmax-backend.onrender.com/api/auth/store/login -H "Content-Type: application/json" -d '{"phone":"x","password":"y"}'; done

# CORS rejection test (should 403)
curl -i -H "Origin: https://evil.com" https://rxmax-backend.onrender.com/api/health
```
