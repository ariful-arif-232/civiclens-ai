# CivicLens AI

**From citizen reports to actionable infrastructure intelligence.**

An existing Next.js / React / TypeScript / Tailwind app, migrated in place to Neon PostgreSQL, Cloudinary image storage, and Gemini image-plus-text analysis. The six original pages, risk model, protected authority workflow, and three original Git commits are preserved.

## Current verification status - read this first

This is a **migration handoff, not a claimed live deployment**.

- Live Neon `civiclens-ai` database: baseline is applied; constraints, status transitions, optimistic updates, JSON insertion and atomic request budgets verified through the Neon connector. Test fixtures were rolled back; no citizen reports were seeded.
- Cloudinary connector: storage upload was verified separately. The application still needs its runtime API credentials.
- 29 dependency-free integration-transport unit tests pass with mocked HTTP responses.
- 26 original risk tests pass after transpilation using the available offline compiler.
- Source syntax checks pass. This is not full TypeScript checking.
- The original version reported 40 tests and a production build. **Those results do not certify the changed version.** Full lint, exact-version typecheck, full tests, build and browser QA could not be rerun because npm registry access is unavailable in the current execution environment.
- No GitHub push or Vercel deployment has been completed. No real Gemini call has been made.

See [verification details](docs/VERIFICATION.md) and [deployment handoff](docs/DEPLOYMENT.md).

## Local, explicitly labeled demonstration

```bash
npm ci
npm run demo:setup
npm run dev
```

Open http://localhost:3000. Demo reports are stored in `.data/` and include fictional seed reports. Demo analysis is text-rule simulation, not image AI. `demo:setup` refuses to overwrite existing `.env.local`. For authority actions, read the generated token privately from that ignored file; never publish it.

Do not deploy this JSON-file demo mode to Vercel. The code rejects that configuration because it is not durable serverless persistence.

## Live configuration

Use only the existing **Neon civiclens-ai** project in Singapore. Neither `mess-manager` nor `my-portfolio-db` in Supabase may be paused, reused or altered.

Configure these values in the host's secure server environment:

| Name | Meaning |
|---|---|
| `DEMO_MODE` | `false` |
| `DATABASE_URL` | Existing CivicLens Neon PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account/cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary server API key |
| `CLOUDINARY_API_SECRET` | Cloudinary server secret |
| `GEMINI_API_KEY` | Key for a project whose free tier you have confirmed |
| `GEMINI_MODEL` | Default `gemini-2.5-flash-lite`; verify availability in your account |
| `ADMIN_TOKEN` | Cryptographically random value of at least 24 characters |
| `FREE_TIER_CONFIRMED` | Set `true` only after checking provider plans/key/model |
| `MAX_REPORTS_PER_DAY` | Default `20`; integer from 1 to 100 |

The app cannot infer billing status from an API key. Do not enable billing or paid model fallbacks. Provider free quotas may reject requests; application quotas are safeguards, not a billing guarantee. The cloud connector's authentication is not automatically the deployed application's runtime credentials.

Copy `.env.example` to `.env.local` only for local live development. Fill secrets privately; `.env*` except `.env.example` are ignored. Run:

```bash
npm run preflight
npm run db:verify
```

The existing database is already initialized. `db:migrate` is only for a verified empty/dedicated CivicLens database. It requires `CONFIRM_CIVICLENS_DATABASE=true`, refuses unrelated public tables, applies statements as a transaction, and does not reset existing data. The connector-installed baseline has its original recorded checksum; an existing baseline is verified rather than overwritten. Never edit an applied migration in production; add a new version.

## Architecture

```text
Browser form (photo <= 4 MB + description + area)
  -> Next.js POST /api/reports
  -> origin/input validation and image decoding
  -> strip metadata; resize and encode WebP
  -> persisted per-IP/per-minute/daily submission budget
  -> Cloudinary signed upload in civiclens-ai/reports/<UUID>
  -> Gemini (normalized image bytes + text -> structured JSON)
  -> Zod validation; at most two attempts
  -> deterministic risk score
  -> Neon PostgreSQL insert
  -> report result / issues / dashboard
  -> protected authority PATCH -> persisted status
```

Production secrets are used server-side only. Three small dependency-free HTTP transports are isolated in `lib/integrations/`; wrappers with `server-only` protect application usage. No new ORM, server, or provider SDK was introduced. The existing unused Supabase package/legacy migration remain temporarily for lockfile stability until an online cleanup and full build can be performed; **no application route uses Supabase**.

### Pages and endpoints

`/`, `/report`, `/issues`, `/issues/[id]`, `/dashboard`, `/admin`.

`POST/GET /api/reports`, `GET/PATCH /api/reports/[id]`, `GET /api/dashboard`, `GET /api/health`.

`/api/health` checks DB connectivity and configuration only, NOT real Gemini or Cloudinary operation. The local-only `/api/reports/[id]/image` serves normalized demo images; production uses stored Cloudinary HTTPS URLs.

### AI boundary

Gemini receives only the normalized photograph and description. Text in either is untrusted evidence, not instructions. The schema allows category, severity, summary, and reasoning, never a risk score. The application revalidates the response. Missing configuration fails closed before upload; an invalid/unavailable AI response after bounded retries produces a clearly labeled **fallback for human review**, not a fabricated AI result. Provisional high severity in fallback is a review-queue policy, not an observed hazard.

### Transparent prioritization

The original engine remains unchanged:

| Component | Points |
|---|---|
| Severity | low 10; medium 25; high 40; critical 50 |
| Related frequency, including this report | 1 -> 5; 2-3 -> 10; 4-7 -> 20; 8+ -> 30 |
| Recency | <24h 20; <3d 15; <7d 10; older 5 |

Total is 0-100. Bands: 80+ critical, 60-79 high, 40-59 medium, below 40 low. These are uncalibrated operational priorities, **not probabilities or certified engineering safety assessments**. The age term can underweight old unresolved hazards; authorities should review those separately. AI severity and operational priority are separate labels.

Related reports share normalized area/category and fall within seven days. Resolved reports and demo/real mixing are excluded. These are related reports, not verified duplicates. Dashboard ordering recalculates scores on reads; stored scores are submission snapshots. Area scores use the maximum open issue priority, not an average or probability. Full-list in-memory scoring is intended for a small hackathon dataset; a 10,000-row safety ceiling prevents unbounded growth and production scale needs SQL aggregation.

### Data, privacy and security

Neon stores the `reports`, `civiclens_rate_limits`, and `civiclens_migrations` tables. RLS is enabled and PUBLIC grants are revoked; the server connects with an authorized owner role. Owner-role credentials bypass RLS and must never reach clients. A production system should add least-privilege roles and individual authority accounts.

Images are intentionally public Cloudinary assets for this demonstration. The form discloses public visibility and provider processing; avoid personal/sensitive photos. EXIF metadata is stripped, not faces or text. Gemini free-tier inputs may be used for provider improvement; do not upload confidential material.

Admin tokens remain only in the operator's tab memory and are sent in an Authorization header. Constant-time verification and optimistic expected-status checks protect mutations. Status transitions are also enforced in PostgreSQL. Keys, request bodies, images, and upstream errors are never logged. Database parameters are not interpolated into SQL. Upload results are constrained to the expected account/asset. Ambiguous database timeouts do not blindly delete a potentially persisted report's image.

Daily caps limit reservations, including failed submissions. Each reservation allows at most one upload and two model calls. Prune expired quota rows periodically using the explicit `scripts/db.mjs prune-limits` action (with database confirmation); it never deletes reports. Add verified identity/CAPTCHA and managed abuse protection before a public launch.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
npm run test:transports  # Node-only mocked transport tests, no credentials/network needed
```

The original local end-to-end script uses isolated temporary data and MOCK analysis. PostgreSQL tests use PGlite with the Neon-compatible migration. GitHub Actions is provided but has not run for this migration.

For a **real live** end-to-end test, first finish deployment and configure an authorized real infrastructure image:

```bash
# Set these privately in your shell or ignored .env.local:
# LIVE_URL, TEST_IMAGE_PATH, ADMIN_TOKEN, FREE_TIER_CONFIRMED=true, CONFIRM_LIVE_TEST=true
npm run test:live
```

That test creates a clearly titled verification report, requires `analysis_source=vision`, checks database persistence/dashboard, and progresses its status to resolved. It does not delete the test report. Confirm image delivery and mobile/desktop layouts in a browser separately.

## History and delivery

The archive includes `civiclens-ai-history.bundle`. Clone that bundle to recover the original three commits and new migration commits. Do not publish `.env.local`, `.data`, `node_modules`, `.vercel`, or ZIP/bundle files to GitHub. Do not rewrite Git history to make unverified checks appear completed.

## References

Implementation was checked against the following provider documentation; account-specific availability still requires verification:

- https://neon.com/blog/serverless-driver-ga
- https://github.com/neondatabase/serverless/blob/main/src/httpQuery.ts
- https://cloudinary.com/documentation/image_upload_api_reference
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/pricing
- https://vercel.com/docs/functions/limitations

See [two-minute demo](docs/DEMO.md) and [API guide](docs/API.md).
