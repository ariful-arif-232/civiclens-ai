# CivicLens HTTP API

All dynamic API responses use JSON. Report reads are public; authority writes require `Authorization: Bearer <ADMIN_TOKEN>`. Never log that header.

- `GET /api/health`: readiness, not a real AI/storage test. `503` if setup is incomplete. No secrets returned.
- `POST /api/reports`: multipart fields `photo`, `title`, `description`, `area`, optional paired `latitude`/`longitude`. JPEG/PNG/WebP only, up to 4 MB. Strict text validation; photos decoded/normalized, metadata removed. Real submission requires live secrets, confirmed free tiers, and persistent budget reservation. Returns `201 { report }`. `analysis_source` is `vision`, `mock` or `fallback`; `is_demo` is explicit.
- `GET /api/reports`: optional `category`, `severity`, `status`, `area`, `sort=risk|newest`, `page` and `limit` (1-100). Returns `{reports,total,page,limit}`.
- `GET /api/reports/:id`: UUID only; `{report}` or 404.
- `PATCH /api/reports/:id`: `{status, expectedStatus}`. Transitions: reported -> under_review; under_review -> in_progress or reported; in_progress -> resolved or under_review; resolved -> under_review. Requires admin token. Conflicting edits return 409.
- `GET /api/dashboard`: open/closed totals, risk bands, top issues/areas, category and severity counts.
- `GET /api/reports/:id/image`: local demo image only. Production images use Cloudinary URLs.

Common errors: 400 validation, 401 authority access, 403 origin, 404 unknown report, 409 status conflict, 413 body limit, 415 wrong content type, 429 request budget, 503 configuration/provider/database failure.

Known constraints: public demo without citizen login; no idempotency key yet; globally bounded writes but no city-scale read aggregation. Do not present this as a hardened municipal production system. An AI outage can return a saved report with clearly labeled fallback and provisional high priority for human review, not a real AI finding.
