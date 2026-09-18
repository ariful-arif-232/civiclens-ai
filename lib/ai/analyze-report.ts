import { analysisSchema } from './schemas';
import { type AIProvider, type AnalysisInput } from './provider';
/** One bounded retry; failures remain visibly marked for human triage. */
export async function analyzeInfrastructureReport(
  input: AnalysisInput,
  provider: AIProvider,
  source: 'vision' | 'mock' = 'vision',
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return { ...analysisSchema.parse(await provider.analyze(input)), source };
    } catch {
      /* Do not log user images, provider output or credentials. */
    }
  }
  return {
    category: 'other' as const,
    severity: 'high' as const,
    summary: 'Analysis unavailable. Authority review is required.',
    reasoning:
      'The vision service did not return a valid analysis after two attempts. High provisional severity keeps this unassessed report in the review queue; it is not an AI finding.',
    source: 'fallback' as const,
  };
}
