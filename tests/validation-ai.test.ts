import test from 'node:test';
import assert from 'node:assert/strict';
import { reportInput, patchInput, filtersInput } from '../lib/validation';
import { analysisSchema } from '../lib/ai/schemas';
import { analyzeInfrastructureReport } from '../lib/ai/analyze-report';
import { normalizeArea, findRelatedReports, scoreReports } from '../lib/related-reports';
import { seedReports } from '../lib/demo-data';
const input = {
  title: 'Pothole at Main Gate',
  description: 'Deep pothole endangers people at the crossing.',
  area: 'Main Gate',
  latitude: '',
  longitude: '',
};
const analysis = {
  category: 'road_damage',
  severity: 'high',
  summary: 'A large pothole affects road access.',
  reasoning: 'Visible damage warrants an on-site review.',
};
test('valid input normalizes empty coordinates', () =>
  assert.equal(reportInput.parse(input).latitude, null));
test('reject injected fields, partial coordinates, ranges and short descriptions', () => {
  for (const invalid of [
    { ...input, risk_score: 100 },
    { ...input, latitude: '23' },
    { ...input, latitude: '91', longitude: '90' },
    { ...input, description: 'short' },
  ])
    assert.equal(reportInput.safeParse(invalid).success, false);
});
test('reject bad enums and unknown AI fields', () => {
  assert.equal(analysisSchema.safeParse({ ...analysis, severity: 'extreme' }).success, false);
  assert.equal(analysisSchema.safeParse({ ...analysis, risk_score: 99 }).success, false);
  assert.equal(
    patchInput.safeParse({ status: 'deleted', expectedStatus: 'reported' }).success,
    false,
  );
  assert.equal(filtersInput.safeParse({ limit: 1000 }).success, false);
});
test('malformed AI result retried then marked fallback', async () => {
  let attempts = 0;
  const result = await analyzeInfrastructureReport(
    { description: 'Test', imageData: 'test' },
    {
      async analyze() {
        attempts++;
        return { category: 'bad' };
      },
    },
  );
  assert.equal(attempts, 2);
  assert.equal(result.source, 'fallback');
  assert.equal(result.severity, 'high');
});
test('valid second attempt accepted', async () => {
  let attempts = 0;
  const result = await analyzeInfrastructureReport(
    { description: 'Test', imageData: 'test' },
    {
      async analyze() {
        if (++attempts === 1) throw Error('Unavailable');
        return analysis;
      },
    },
  );
  assert.equal(attempts, 2);
  assert.equal(result.source, 'vision');
});
test('mock results remain labeled', async () => {
  const result = await analyzeInfrastructureReport(
    { description: 'Test', imageData: 'test' },
    {
      async analyze() {
        return analysis;
      },
    },
    'mock',
  );
  assert.equal(result.source, 'mock');
});
test('area normalization supports Bengali, punctuation and spacing', () => {
  assert.equal(normalizeArea('  MAIN-Gate!  '), 'main gate');
  assert.equal(normalizeArea('ঢাকা  বিশ্ববিদ্যালয়'), 'ঢাকা বিশ্ববিদ্যালয়');
});
test('related logic excludes self, resolved, old, other category and real/demo mixing', () => {
  const now = new Date('2026-09-17T12:00:00Z');
  const rows = seedReports(now);
  const target = rows[0];
  const related = findRelatedReports(target, rows, now);
  assert.equal(related.length, 3);
  assert.equal(scoreReports(rows, now)[0].risk_score, 90);
  const altered = related.map((r, i) => ({
    ...r,
    ...(i === 0
      ? { status: 'resolved' as const }
      : i === 1
        ? { created_at: '2020-01-01' }
        : { is_demo: false }),
  }));
  assert.equal(findRelatedReports(target, altered, now).length, 0);
});
