import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { neonJson, neonTransaction } from '../lib/integrations/neon-http.mjs';
const url = process.env.DATABASE_URL;
try {
  if (!url) throw new Error('Set DATABASE_URL securely in .env.local first.');
  const mode = process.argv[2] || 'verify';
  if (!['verify','migrate','prune-limits'].includes(mode)) throw new Error('Unknown database action.');
  if (mode !== 'verify' && process.env.CONFIRM_CIVICLENS_DATABASE !== 'true')
    throw new Error('Confirm this URL belongs ONLY to civiclens-ai: set CONFIRM_CIVICLENS_DATABASE=true.');
  if (mode === 'migrate') {
    const tables = await neonJson(url, `SELECT to_jsonb(tablename) FROM pg_tables WHERE schemaname='public'`);
    if (tables.some(name => !['reports','civiclens_migrations','civiclens_rate_limits'].includes(name)))
      throw new Error('Refusing migration: this database contains unrelated application tables.');
    const existing = tables.includes('civiclens_migrations') ? await neonJson(url,
      `SELECT to_jsonb(version) FROM public.civiclens_migrations WHERE version='001_civiclens'`) : [];
    if (!existing.length) {
      const sql = await readFile(new URL('../db/migrations/001_civiclens.sql', import.meta.url), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const queries = sql.split('-- statement-breakpoint').map(query => ({query:query.trim()})).filter(q => q.query);
      queries.push({query: 'INSERT INTO public.civiclens_migrations(version,checksum) VALUES ($1,$2)', params:['001_civiclens',checksum]});
      await neonTransaction(url, queries);
      console.log('Migration applied transactionally.');
    } else console.log('Existing baseline already applied; verifying without modifying it.');
  }
  if (mode === 'prune-limits') {
    await neonTransaction(url, [{query:"DELETE FROM public.civiclens_rate_limits WHERE window_start < now() - interval '2 days'"}]);
    console.log('Expired CivicLens request-limit rows removed.');
  }
  const [state] = await neonJson(url, `SELECT jsonb_build_object(
    'tables', (SELECT count(*) FROM pg_class WHERE oid IN ('public.reports'::regclass,'public.civiclens_rate_limits'::regclass,'public.civiclens_migrations'::regclass) AND relrowsecurity),
    'columns', (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='reports'),
    'trigger', EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='reports_updated_at' AND tgrelid='public.reports'::regclass),
    'migration', EXISTS(SELECT 1 FROM public.civiclens_migrations WHERE version='001_civiclens'))`);
  if (state.tables!==3 || state.columns!==20 || !state.trigger || !state.migration) throw new Error('Database baseline verification failed.');
  console.log('PASS: CivicLens baseline, 20 report columns, RLS and status trigger.');
} catch (error) {
  console.error(error.message); process.exitCode=1;
}
