# Verification record - 2026-09-18

## Current result

The migrated CivicLens source is now published on GitHub and has passed a complete hosted verification. This does **not** claim a Vercel deployment or real Gemini inference.

Evidence: [successful recovery and checks, run 35298626915](https://github.com/ariful-arif-232/civiclens-ai/actions/runs/35298626915).

The restored application commit begins `8baea97`. The runner used Node 24.20.0 and the committed package-lock.json.

| Check | Result |
|---|---|
| Source archive CRC and SHA256 | PASS |
| All 76 original source-file checksums | PASS |
| Source publication to main | PASS, no force-push |
| npm ci | PASS |
| ESLint | PASS |
| Next.js route type generation and full TypeScript check | PASS |
| Application, PostgreSQL-compatible, risk, validation and security tests | 40 passed, zero failures |
| Mocked HTTP transport tests | 29 passed, zero failures |
| Next.js production build | PASS |
| Production-server local HTTP integration scenario | PASS |

The 69 tests are automated checks. The local end-to-end scenario uses explicitly labeled MOCK analysis and isolated local JSON persistence. It does not claim that Gemini, Cloudinary or Neon was accessed by the deployed application.

## End-to-end coverage actually exercised

The production server was started in an isolated demo environment. Verification covered all six pages, image decoding and normalization, report submission, labeled demo analysis, deterministic scoring, durable persistence across a server restart, issue retrieval, filtering, dashboard updates, rejected unauthenticated status writes, valid status transitions, stale-update conflicts and safe errors when production configuration is absent.

Browser rendering, mobile layout and a real deployed report remain separate verification gates.

## Root cause and exact repair

The previous restore jobs failed before dependency installation with `gzip: stdin: invalid compressed data--crc error`. The manually transported compressed archive contained one incorrect byte. Comparison with the original uploaded ZIP isolated the defect to compressed offset 75604: 0x56 instead of 0x52. It affected one character in package-lock.json after decompression.

The corrected archive passed its original gzip CRC, full SHA256 and all 76 per-file hashes against the user's original ZIP. No integrity check was disabled, and no package integrity value was guessed. See SOURCE-RECOVERY.md and SOURCE-RECOVERY.sha256.

The temporary restore directories were removed from main after recovery, without deleting Git history. The obsolete restore-trigger pull request was closed without merging. The one-time restoration workflow was removed; ordinary CI now verifies source directly.

## Prior live connector checks

The existing Neon project is `civiclens-ai` (`ancient-heart-79855573`), production branch `br-flat-morning-b3z34hqn`, database `neondb`.

Earlier authenticated connector checks verified the baseline migration, table constraints, row security, status/timestamp trigger, optimistic updates, JSON insert/read shape and atomic request budget. Temporary fixtures were rolled back; no citizen reports were seeded.

An earlier Cloudinary connector upload verified account storage access in the CivicLens verification namespace. That was not an application runtime upload or AI analysis.

## Remaining deployment gates

- Vercel still needs the dedicated CivicLens project imported from this GitHub repository.
- The connected Vercel deployment action rejects its exposed no-argument invocation because the service requires target, name and files. No undocumented arguments or unrelated projects were used to bypass this limitation.
- Runtime DATABASE_URL, Cloudinary API credentials, GEMINI_API_KEY and ADMIN_TOKEN must be configured securely for the application. Connector access does not automatically provide application runtime secrets.
- The account's Gemini model availability and free quota must be verified. No real Gemini call has been performed.
- After deployment: check /api/health, run the authorized real-image test, then verify the UI on desktop and mobile. Record real outcomes here.

## Warnings and limitations

The successful run reported an ESLint version-support warning and Node-runtime deprecation warnings for the v4 GitHub actions. They did not cause the prior CRC failure. A green build and an npm audit result are not a guarantee of complete security.

Legacy Supabase files/packages are retained for now, but the application production routes use Neon and Cloudinary. The existing external mess-manager and my-portfolio-db projects remain untouched.

The original local development Git commits remain in the history bundle inside the uploaded ZIP. They have not been recreated or presented as imported original commits in GitHub.

No paid action, plan upgrade, secret publication or modification to unrelated applications was performed.
