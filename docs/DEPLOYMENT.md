# Remaining deployment actions

The code is prepared, but this environment has three real execution blockers:

1. No runtime secrets are configured here. App connectors do not automatically give a deployed app `DATABASE_URL`, Cloudinary keys, or `GEMINI_API_KEY`.
2. `ariful-arif-232/civiclens-ai` returns 404. The available GitHub tool set has no create-repository action, and no authenticated local `gh`/Git CLI session is present. Other existing repositories must not be reused.
3. The Vercel deployment tool's exposed schema accepts no arguments, but the service rejects the call because `target`, `name`, and `files` are missing. No valid supported request can currently be issued from that tool. It did not deploy anything.

Separately, this runtime cannot resolve the npm registry, so exact-version package installation/full build is blocked. Run CI in an internet-enabled environment before deployment.

## Recover all history, without restarting

From the directory holding the extracted bundle:

```bash
git clone civiclens-ai-history.bundle civiclens-ready
cd civiclens-ready
git remote remove origin
npm ci
npm run check
npm run test:integration
```

Create a new **private** GitHub repository named `civiclens-ai` under `ariful-arif-232`, without a README/license/init commit. Do not reuse any of the existing app repositories. With an authenticated GitHub CLI, the equivalent is:

```bash
gh repo create ariful-arif-232/civiclens-ai --private --source=. --remote=origin --push
```

Otherwise create the empty repository in GitHub and use:

```bash
git remote add origin https://github.com/ariful-arif-232/civiclens-ai.git
git push -u origin main
```

## Vercel

Import only this new repository into the already connected Hobby account. Use Next.js auto-detection, root directory `.`, and the included `vercel.json`. Do not enable paid add-ons, paid plans or a custom domain purchase. Configure the variables listed in README in Vercel's server-side Production environment. Do not set `DEMO_MODE=true` on Vercel.

Get the Neon connection string from the existing `civiclens-ai` project's Connect panel. Get Cloudinary runtime API credentials from the account's API Keys settings. Create/configure a Gemini key for a free-tier project, with no billing upgrade; confirm the selected model's availability. Generate the authority token locally using a password manager or crypto-safe generator. Never paste these secrets in an ordinary chat or commit them.

Set `FREE_TIER_CONFIRMED=true` only after verifying all provider plans. The current code cannot guarantee billing from a key alone. `MAX_REPORTS_PER_DAY=20` is an application safeguard, not a provider budget setting.

First run preflight and read-only DB verification in an environment with secrets and internet. No new Neon project or database reset is necessary. Do not migrate `mess-manager` or `my-portfolio-db`.

Deploy, then check `/api/health`, run the authorized `npm run test:live` check, and inspect mobile/desktop pages in a browser. Record real results in `docs/VERIFICATION.md`; do not carry over old passing results.

## Optional cleanup after an online full verification

The unused Supabase package and legacy directory were intentionally retained rather than inventing an unverified lockfile rewrite offline. Remove them using `npm uninstall @supabase/supabase-js` and `npm uninstall -D supabase`, then remove only this repository's unused `lib/supabase/` and `supabase/` files and rerun all checks. This is local code cleanup, never an action on existing live Supabase projects.
