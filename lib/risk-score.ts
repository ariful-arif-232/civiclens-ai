import type { Severity } from './types';
export const severityScores: Record<Severity, number> = {
  low: 10,
  medium: 25,
  high: 40,
  critical: 50,
};
export function riskLevel(score: number) {
  return score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Medium' : 'Low';
}
/** Count includes this report. Boundaries are inclusive; future timestamps have age zero. */
export function calculateRisk(
  severity: Severity,
  count: number,
  createdAt: string,
  now = new Date(),
) {
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp) || !Number.isFinite(now.getTime()))
    throw new Error('Invalid report date');
  if (!Number.isInteger(count) || count < 1)
    throw new Error('Report count must be a positive integer');
  const age = Math.max(0, now.getTime() - timestamp) / 86_400_000;
  const frequency = count >= 8 ? 30 : count >= 4 ? 20 : count >= 2 ? 10 : 5;
  const recency = age <= 1 ? 20 : age <= 3 ? 15 : age <= 7 ? 10 : 5;
  const base = severityScores[severity];
  if (base === undefined) throw new Error('Invalid severity');
  const score = base + frequency + recency;
  return { score, level: riskLevel(score), severity: base, frequency, recency };
}
