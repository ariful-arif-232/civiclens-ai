import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRisk, riskLevel } from '../lib/risk-score';
const now = new Date('2026-09-17T12:00:00Z');
const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
test('critical + 8 recent reports reaches maximum', () =>
  assert.equal(calculateRisk('critical', 8, ago(0), now).score, 100));
test('old low severity single report scores low', () =>
  assert.deepEqual(calculateRisk('low', 1, ago(8), now), {
    score: 20,
    level: 'Low',
    severity: 10,
    frequency: 5,
    recency: 5,
  }));
for (const [count, points] of [
  [1, 5],
  [2, 10],
  [3, 10],
  [4, 20],
  [7, 20],
  [8, 30],
  [50, 30],
])
  test(`frequency boundary ${count}`, () =>
    assert.equal(calculateRisk('high', count, ago(0), now).frequency, points));
for (const [days, points] of [
  [0, 20],
  [1, 20],
  [1.001, 15],
  [3, 15],
  [3.001, 10],
  [7, 10],
  [7.001, 5],
  [-1, 20],
])
  test(`recency boundary ${days}`, () =>
    assert.equal(calculateRisk('high', 1, ago(days), now).recency, points));
for (const [score, level] of [
  [0, 'Low'],
  [39, 'Low'],
  [40, 'Medium'],
  [59, 'Medium'],
  [60, 'High'],
  [79, 'High'],
  [80, 'Critical'],
  [100, 'Critical'],
] as const)
  test(`level boundary ${score}`, () => assert.equal(riskLevel(score), level));
test('reject invalid input', () => {
  assert.throws(() => calculateRisk('low', 0, ago(0), now));
  assert.throws(() => calculateRisk('low', 1.2, ago(0), now));
  assert.throws(() => calculateRisk('low', 1, 'invalid', now));
});
