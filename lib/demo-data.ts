import type { Report, Category, Severity, Status } from './types';
import { normalizeArea } from './related-reports';
export function seedReports(now = new Date()): Report[] {
  const items: [string, string, Category, Severity, Status, number][] = [
    [
      'Deep pothole at the main crossing',
      'University Main Gate',
      'road_damage',
      'critical',
      'reported',
      1,
    ],
    [
      'Road surface collapsing beside crossing',
      'University Main Gate',
      'road_damage',
      'critical',
      'under_review',
      4,
    ],
    [
      'Pothole blocking the pedestrian approach',
      'University Main Gate',
      'road_damage',
      'high',
      'reported',
      8,
    ],
    [
      'Unsafe roadway beside the bus stop',
      'University Main Gate',
      'road_damage',
      'high',
      'reported',
      12,
    ],
    [
      'Overflowing drains after rainfall',
      'Academic Building',
      'drainage',
      'critical',
      'under_review',
      5,
    ],
    [
      'Standing water at the building entrance',
      'Academic Building',
      'drainage',
      'high',
      'reported',
      9,
    ],
    [
      'Water leaking across the footpath',
      'Student Hall',
      'water_leakage',
      'high',
      'in_progress',
      16,
    ],
    [
      'Broken streetlights on library walk',
      'Central Library',
      'streetlight',
      'high',
      'under_review',
      20,
    ],
    ['Overflowing bins beside the cafeteria', 'Cafeteria', 'garbage', 'medium', 'reported', 38],
    ['Damaged seating in the courtyard', 'Student Hall', 'public_facility', 'low', 'resolved', 120],
    ['Blocked drain by the cycle stand', 'Academic Building', 'drainage', 'medium', 'reported', 52],
    ['Streetlight repaired at the east gate', 'East Gate', 'streetlight', 'low', 'resolved', 160],
  ];
  return items.map(([title, area, category, severity, status, hours], i) => {
    const date = new Date(now.getTime() - hours * 3600_000).toISOString();
    return {
      id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      title,
      description: `${title}. This is a fictional campus report for the CivicLens demonstration.`,
      area,
      area_key: normalizeArea(area),
      category,
      severity,
      status,
      created_at: date,
      updated_at: date,
      image_path: null,
      image_url: null,
      ai_summary: title,
      ai_reasoning:
        'Seeded demonstration analysis, not an actual AI assessment. Priority combines severity, recent related reports and report age.',
      analysis_source: 'mock',
      latitude: null,
      longitude: null,
      risk_score: 0,
      related_count: 1,
      is_demo: true,
    };
  });
}
