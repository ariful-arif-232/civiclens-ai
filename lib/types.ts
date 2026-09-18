export const categories = [
  'road_damage',
  'streetlight',
  'garbage',
  'water_leakage',
  'drainage',
  'public_facility',
  'other',
] as const;
export const severities = ['low', 'medium', 'high', 'critical'] as const;
export const statuses = ['reported', 'under_review', 'in_progress', 'resolved'] as const;
export type Category = (typeof categories)[number];
export type Severity = (typeof severities)[number];
export type Status = (typeof statuses)[number];
export type AnalysisSource = 'vision' | 'mock' | 'fallback';
export interface Analysis {
  category: Category;
  severity: Severity;
  summary: string;
  reasoning: string;
}
export interface Report {
  id: string;
  title: string;
  description: string;
  image_path: string | null;
  image_url?: string | null;
  category: Category;
  severity: Severity;
  ai_summary: string;
  ai_reasoning: string;
  analysis_source: AnalysisSource;
  area: string;
  area_key: string;
  latitude: number | null;
  longitude: number | null;
  status: Status;
  risk_score: number;
  related_count: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}
export interface ScoredReport extends Report {
  risk: { score: number; level: string; severity: number; frequency: number; recency: number };
}
export const label = (s: string) => s.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
