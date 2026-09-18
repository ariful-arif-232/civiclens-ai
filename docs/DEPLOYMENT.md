# Remaining live deployment actions

## Already completed

The source is published in `ariful-arif-232/civiclens-ai`. The compressed upload error is fixed. Hosted verification passed: npm ci, ESLint, TypeScript, 69 tests, production build and the local production-server demo integration scenario. See VERIFICATION.md for the run link and scope.

Do not recreate the repository, repeat restoration, or upload encoded source chunks again.

## 1. Import the existing repository into Vercel

Use the already connected Vercel account and Hobby team `ariful-arif`.

In the dashboard choose **Add New > Project**, select the GitHub repository **ariful-arif-232/civiclens-ai**, and import it as **civiclens-ai**. Keep the root directory at `.`, Next.js framework detection and the included vercel.json build configuration. Do not reuse any existing portfolio/store project, upgrade a plan, or purchase a domain.

The chat's Vercel deployment action currently exposes no input fields but the upstream service requires `target`, `name` and `files`. A valid call returned that schema error; it did not create a deployment. Dashboard import is necessary unless an authenticated, supported deployment capability becomes available. GitHub access is working and does not need to be reconnected.

## 2. Configure server-side production environment variables

| Variable | Obtain / set privately |
|---|---|
| DATABASE_URL | Connect panel of the EXISTING Neon civiclens-ai project in Singapore |
| CLOUDINARY_CLOUD_NAME | Existing Cloudinary account |
| CLOUDINARY_API_KEY | Existing Cloudinary API Keys settings |
| CLOUDINARY_API_SECRET | Existing Cloudinary API Keys settings |
| GEMINI_API_KEY | The user's own Gemini API project with verified free-tier eligibility |
| GEMINI_MODEL | A currently available vision-capable model in that account; configurable |
| ADMIN_TOKEN | Password manager or cryptographically random generator, at least 24 characters |
| DEMO_MODE | false |
| FREE_TIER_CONFIRMED | true only after confirming all accounts, model and quotas |
| MAX_REPORTS_PER_DAY | 20 |

Never paste secrets in chat, commit them, put them in NEXT_PUBLIC variables, or show them in screenshots. Keep them in Vercel's secure server environment. Do not assume that connecting a chat app supplies runtime credentials automatically.

To generate an authority token locally without displaying it:

```bash
umask 077
node -e "require('node:fs').writeFileSync('admin-token.local',require('node:crypto').randomBytes(32).toString('base64url'),{mode:0o600})"
```

Use a password manager instead where practical. Never add that local file to Git; remove it after securely transferring the token. The token is required for admin status changes, not a public demo password.

The application quota is not a provider-side billing limit. Do not enable paid billing or model fallbacks. Missing credentials should remain clearly reported, never silently replaced with mock AI in production.

## 3. Deploy and verify real operation

Deploy after the environment is configured. If variables were added after a build, redeploy so that the deployment receives them.

The Neon baseline is already applied. Do not reset it or create another Neon project. Do not change `mess-manager` or `my-portfolio-db` in Supabase.

Check `/api/health`, then use a non-sensitive real infrastructure photograph:

`/report -> image upload -> Gemini analysis -> risk score -> Neon save -> issue details -> dashboard -> authorized admin status change`.

For scripted verification configure LIVE_URL, TEST_IMAGE_PATH, ADMIN_TOKEN, FREE_TIER_CONFIRMED=true and CONFIRM_LIVE_TEST=true securely, then run `npm run test:live` in an authenticated local environment. This creates a labeled verification report and progresses it to resolved; it does not silently delete a report. It requires the response to identify real vision analysis.

Finally inspect desktop and mobile layouts in a browser. Record actual results in VERIFICATION.md. A passing local demo does not establish a live deployment or real AI inference.
