import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('Neon-compatible migration, constraints, RLS, grants, statuses and rate budgets work in PostgreSQL', async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile(new URL('../db/migrations/001_civiclens.sql', import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO public.reports(id,title,description,category,severity,ai_summary,ai_reasoning,analysis_source,area,area_key,risk_score)
      VALUES ('20000000-0000-4000-8000-000000000001','Test report','A deep pothole blocks road access.','road_damage','high',
      'A pothole needs inspection.','Provisional assessment; inspect on site.','vision','Main Gate','main gate',65)`);
    for (const sql of ["UPDATE public.reports SET severity='extreme'", 'UPDATE public.reports SET risk_score=101',
      'UPDATE public.reports SET latitude=91,longitude=90', 'UPDATE public.reports SET latitude=23,longitude=null',
      "UPDATE public.reports SET image_path='civiclens-ai/reports/foreign'", "UPDATE public.reports SET image_url='http://evil.test'",
      "UPDATE public.reports SET status='resolved'", "UPDATE public.reports SET analysis_source='mock'"]) {
      await assert.rejects(() => db.exec(sql), sql);
    }
    const before = (await db.query<{updated_at:string}>('SELECT updated_at::text FROM public.reports')).rows[0].updated_at;
    for (const status of ['under_review','in_progress','resolved']) await db.query('UPDATE public.reports SET status=$1', [status]);
    const after = (await db.query<{updated_at:string}>('SELECT updated_at::text FROM public.reports')).rows[0].updated_at;
    assert.notEqual(before,after);
    await db.exec('CREATE ROLE test_visitor; SET ROLE test_visitor');
    await assert.rejects(() => db.query('SELECT * FROM public.reports'));
    await db.exec('RESET ROLE');
    const rls = await db.query<{n:number}>("SELECT count(*)::int n FROM pg_class WHERE relname IN ('reports','civiclens_rate_limits','civiclens_migrations') AND relrowsecurity");
    assert.equal(rls.rows[0].n,3);
    const reserve = () => db.query(`INSERT INTO civiclens_rate_limits(key,window_start,attempts) VALUES ('test',date_trunc('day',now()),1)
      ON CONFLICT(key,window_start) DO UPDATE SET attempts=civiclens_rate_limits.attempts+1
      WHERE civiclens_rate_limits.attempts < 2 RETURNING attempts`);
    assert.equal((await reserve()).rows.length,1); assert.equal((await reserve()).rows.length,1);
    assert.equal((await reserve()).rows.length,0);
  } finally { await db.close(); }
});
