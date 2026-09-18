import type { Report, ScoredReport } from './types';
import { calculateRisk } from './risk-score';
export const RELATED_WINDOW_DAYS = 7;
export function normalizeArea(area: string) {
  return area
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[\p{P}\p{Z}\s]+/gu, ' ')
    .trim();
}
export function findRelatedReports(
  report: Pick<Report, 'id' | 'category' | 'area' | 'is_demo'>,
  reports: Report[],
  now = new Date(),
) {
  return reports.filter(
    (r) =>
      r.id !== report.id &&
      r.is_demo === report.is_demo &&
      r.category === report.category &&
      normalizeArea(r.area) === normalizeArea(report.area) &&
      r.status !== 'resolved' &&
      Date.parse(r.created_at) <= now.getTime() &&
      Date.parse(r.created_at) >= now.getTime() - RELATED_WINDOW_DAYS * 86_400_000,
  );
}
export function scoreReports(reports: Report[], now = new Date()): ScoredReport[] {
  return reports.map((r) => {
    const count = r.status === 'resolved' ? 1 : 1 + findRelatedReports(r, reports, now).length;
    const risk = calculateRisk(r.severity, count, r.created_at, now);
    return { ...r, related_count: count, risk_score: risk.score, risk };
  });
}
