import 'server-only';
import { listRaw, attachImage } from './repository';
import { scoreReports, normalizeArea } from './related-reports';
import { filtersInput } from './validation';
import type { ScoredReport } from './types';
export async function currentReports() {
  return scoreReports(await listRaw()).sort(
    (a, b) => b.risk_score - a.risk_score || b.created_at.localeCompare(a.created_at),
  );
}
export function filterReports(rows: ScoredReport[], input: unknown) {
  const filters = filtersInput.parse(input);
  let filtered = rows.filter(
    (r) =>
      (!filters.category || r.category === filters.category) &&
      (!filters.severity || r.severity === filters.severity) &&
      (!filters.status || r.status === filters.status) &&
      (!filters.area || normalizeArea(r.area).includes(normalizeArea(filters.area))),
  );
  if (filters.sort === 'newest')
    filtered = filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    reports: filtered.slice((filters.page - 1) * filters.limit, filters.page * filters.limit),
    total: filtered.length,
    page: filters.page,
    limit: filters.limit,
  };
}
export async function withImages(rows: ScoredReport[]) {
  return Promise.all(rows.map(async (r) => ({ ...r, ...(await attachImage(r)) })));
}
export function aggregateDashboard(rows: ScoredReport[]) {
  const open = rows.filter((r) => r.status !== 'resolved').sort((a,b) => b.risk_score - a.risk_score);
  const areas = new Map<string, { area: string; reports: number; urgent: number; risk: number }>();
  for (const row of open) {
    const key = normalizeArea(row.area),
      area = areas.get(key) || { area: row.area, reports: 0, urgent: 0, risk: 0 };
    area.reports++;
    area.urgent += Number(row.risk_score >= 60);
    area.risk = Math.max(area.risk, row.risk_score);
    areas.set(key, area);
  }
  const count = (key: 'category' | 'severity') =>
    Object.entries(
      rows.reduce(
        (acc, r) => ({ ...acc, [r[key]]: (acc[r[key]] || 0) + 1 }),
        {} as Record<string, number>,
      ),
    ).map(([name, value]) => ({ name, value }));
  return {
    totalReports: rows.length,
    criticalIssues: open.filter((r) => r.risk_score >= 80).length,
    highRiskIssues: open.filter((r) => r.risk_score >= 60 && r.risk_score < 80).length,
    openReports: open.length,
    resolvedIssues: rows.length - open.length,
    topRiskAreas: [...areas.values()].sort((a, b) => b.risk - a.risk).slice(0, 6),
    topPriorityIssues: open.slice(0, 6),
    recentReports: [...open]
      .filter((r) => r.risk_score >= 60)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5),
    categoryBreakdown: count('category'),
    severityBreakdown: count('severity'),
    generatedAt: new Date().toISOString(),
  };
}
