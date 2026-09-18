import type { Analysis } from '../types';
export interface AnalysisInput {
  description: string;
  imageData: string;
}
export interface AIProvider {
  analyze(input: AnalysisInput): Promise<unknown>;
}
export class GeminiVisionProvider implements AIProvider {
  async analyze(input: AnalysisInput): Promise<unknown> {
    const { analysisJsonSchema } = await import('./schemas');
    const { analyzeWithGemini, geminiConfig } = await import('../integrations/gemini-http.mjs');
    return analyzeWithGemini(input, analysisJsonSchema, geminiConfig());
  }
}
export class DemoProvider implements AIProvider {
  async analyze({ description }: AnalysisInput): Promise<Analysis> {
    const text = description.toLowerCase();
    const category = /pothole|road/.test(text)
      ? 'road_damage'
      : /light/.test(text)
        ? 'streetlight'
        : /garbage|waste/.test(text)
          ? 'garbage'
          : /leak/.test(text)
            ? 'water_leakage'
            : /drain|flood/.test(text)
              ? 'drainage'
              : /bench|facility/.test(text)
                ? 'public_facility'
                : 'other';
    return {
      category,
      severity: /danger|deep|unsafe|large/.test(text) ? 'high' : 'medium',
      summary: `Demo classification: ${description.slice(0, 220)}`,
      reasoning:
        'DEMO ONLY: simple text rules generated this example. The photograph was not analyzed by AI. Human inspection is required.',
    };
  }
}
