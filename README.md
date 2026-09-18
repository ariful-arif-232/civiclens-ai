# CivicLens AI

**From citizen reports to actionable infrastructure intelligence.**

A Next.js, React, TypeScript and Tailwind application for reporting infrastructure problems and transparently prioritizing follow-up. The existing six-page application was migrated in place to Neon PostgreSQL, Cloudinary image storage and Gemini image-plus-text analysis.

## Current status

**Source published; hosted build and tests passed. Live deployment and real AI verification are still pending.**

[Successful hosted verification](https://github.com/ariful-arif-232/civiclens-ai/actions/runs/35298626915): locked dependency installation, ESLint, full TypeScript checks, **69 automated tests**, production build and the production-server demo integration scenario all passed. The integration scenario uses explicitly labeled mock analysis, not real Gemini.

A compressed-upload CRC error was repaired by comparing the original uploaded ZIP and checking all 76 source-file hashes. The temporary restore workflow is no longer needed. See [verification](docs/VERIFICATION.md), [recovery provenance](docs/SOURCE-RECOVERY.md), and [deployment](docs/DEPLOYMENT.md).

The existing live Neon baseline was verified separately through its connector. Application runtime credentials and Vercel deployment are not automatically supplied by connected chat apps. No live deployment or real Gemini result is claimed.

## Product flow

```text
Photo + citizen description + area
                  |
          Next.js server validation
                  |
      Image decoding / metadata removal
                  |
       Cloudinary + Gemini image/text
                  |
         Strict analysis validation
                  |
       Deterministic priority scoring
                  |
        Neon database persistence
                  |
     Issues / risk dashboard / authority
```

AI classifies unstructured evidence. Application logic calculates the priority score. CivicLens is a decision-support prototype, not a certified engineering safety assessment or an emergency-response service.

## Local demo

Use Node 24 and npm:

```bash
npm ci
npm run demo:setup
npm run dev
```

Open http://localhost:3000. Demo reports use fictional seed data in `.data/`. Demo analysis is a labeled text-rule simulation, not image AI. `demo:setup` refuses to overwrite an existing `.env.local`. Read the generated authority token privately from that ignored file.

**Never deploy local JSON demo mode on Vercel.** The app rejects it because it is not durable serverless storage.

## Live configuration

Use only the existing Neon **civiclens-ai** project in Singapore. Do not pause, reuse, alter or migrate the unrelated Supabase `mess-manager` or `my-portfolio-db` projects.

Add secrets to the dedicated Vercel project's server-side Production environment. Never put secret values in chat, source code, logs or Git commits.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Existing Neon PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary server credential |
| `CLOUDINARY_API_SECRET` | Cloudinary signing secret |
| `GEMINI_API_KEY` | Gemini API credential; not a chat subscription |
| `GEMINI_MODEL` | Configurable model; code defaults to `gemini-2.5-flash-lite`; verify account availability |
| `ADMIN_TOKEN` | Cryptographically random token, at least 24 characters |
| `DEMO_MODE` | `false` on Vercel |
| `FREE_TIER_CONFIRMED` | `true` only after verifying account, model and free quota |
| `MAX_REPORTS_PER_DAY` | Default 20; application safeguard, not a provider billing guarantee |

The application cannot determine billing eligibility from an API key. Do not enable paid billing or paid fallbacks without separate approval. Keep the provider model configurable and treat quota errors honestly.

The Neon database already has its baseline migration. With correctly configured local secrets:

```bash
npm run preflight
npm run db:verify
```

Do not reset or recreate it. `db:migrate` requires `CONFIRM_CIVICLENS_DATABASE=true`, rejects unrelated tables, runs transactionally, and verifies an existing baseline instead of overwriting it. Later schema changes need new migrations.

## Pages and APIs

| Page | Purpose |
|---|---|
| `/` | Product overview |
| `/report` | Photo, description and area submission |
| `/issues` | Issue explorer with filters |
| `/issues/[id]` | Report evidence, analysis and priority |
| `/dashboard` | Risk summary and open-issue prioritization |
| `/admin` | Protected authority status updates |

APIs: `POST /api/reports`, `GET /api/reports`, `GET /api/reports/[id]`, `PATCH /api/reports/[id]`, `GET /api/reports/[id]/image`, `GET /api/dashboard` and `GET /api/health`. See [API details](docs/API.md).

## AI and risk model

Gemini receives normalized image bytes and the citizen description. Both are untrusted evidence, not instructions. The validated AI contract contains only `category`, `severity`, `summary` and `reasoning`; the model does not supply a risk score.

Missing live configuration fails closed before upload. Malformed/unavailable AI output after bounded retries is explicitly labeled as a **fallback for human review**, not a fabricated AI result. Provisional fallback severity is a review-queue policy rather than an observed hazard.

| Component | Weights |
|---|---|
| Severity | low 10; medium 25; high 40; critical 50 |
| Related report frequency | 1: 5; 2-3: 10; 4-7: 20; 8+: 30 |
| Recency | within 24h: 20; 3d: 15; 7d: 10; older: 5 |

Score range: 0-100. Priority bands: critical 80+, high 60-79, medium 40-59 and low below 40. These operational scores are **not probabilities**. The recency term can underweight old unresolved problems; authorities should review those separately.

Related reports have the same normalized area/category and a seven-day time window. Resolved reports and mixed demo/real data are excluded. These are possible related reports, not verified duplicates. Current scores refresh on reads; saved scores are submission snapshots. Area priority uses the maximum open-issue score. In-memory aggregation is intended for small hackathon datasets, not production-scale analytics.

## Security and privacy

- Server-only wrappers isolate Neon, Cloudinary and Gemini HTTP transports. The browser never receives provider secrets.
- Requests, images, enums, coordinates and AI output are validated. Uploaded images are decoded, normalized and stripped of EXIF metadata.
- Cloudinary image URLs are intentionally public. The UI discloses public visibility and provider processing. Avoid personal/confidential images; metadata removal does not blur faces or text.
- Admin tokens are kept only in tab memory and sent in an Authorization header. Constant-time checking, allowed status transitions and optimistic expected-status updates protect writes.
- Neon tables use RLS and revoked PUBLIC grants. Owner-role connection credentials can bypass RLS and must remain server-side. Individual admin accounts and a least-privilege database role are future hardening work.
- Daily budgets include failed submissions; each reservation allows at most one upload and two model calls. Public production use needs stronger identity and abuse protection.
- A database timeout does not blindly delete an image that may belong to a successfully persisted report.

Unused legacy Supabase source/packages remain for now to minimize dependency changes. **No production application route uses Supabase**, and neither unrelated live Supabase project is touched.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
```

`npm test` runs 40 application/PostgreSQL-compatible tests and 29 mocked HTTP transport tests. The database tests use PGlite. The integration script starts the production server with isolated local demo data, exercises all pages and the report/status flow, checks restart durability, and verifies missing-configuration failures.

After an actual deployment, configure a real infrastructure image and the documented live-test environment, then run:

```bash
npm run test:live
```

The live test requires `LIVE_URL`, `TEST_IMAGE_PATH`, `ADMIN_TOKEN`, `FREE_TIER_CONFIRMED=true` and `CONFIRM_LIVE_TEST=true`. It creates a clearly titled verification report, requires `analysis_source=vision`, checks persistence/dashboard, and progresses the report to resolved. It does not silently delete the record. Browser and mobile QA are separate checks.

## Deployment and demo

Import this repository into the existing Vercel Hobby account as **civiclens-ai**, with root `.`, Next.js auto-detection and the included `vercel.json`. Configure the live environment securely before treating the application as operational. Do not purchase domains, change plans or modify existing applications.

See [deployment steps](docs/DEPLOYMENT.md), [two-minute demo and judge preparation](docs/DEMO.md) and [verification evidence](docs/VERIFICATION.md).

The previous local development Git commits are preserved in `civiclens-ai-history.bundle` inside the user-uploaded ZIP. They have not been recreated or misrepresented as imported original commits in the GitHub graph. Current GitHub history is retained without force-push. Never commit `.env.local`, `.data`, `node_modules`, `.vercel` or secret-bearing archives.
