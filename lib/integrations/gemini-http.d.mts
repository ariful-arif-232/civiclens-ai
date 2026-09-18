export const DEFAULT_GEMINI_MODEL: string;
export interface GeminiConfig { key: string; model: string }
export function geminiConfig(env?: NodeJS.ProcessEnv): GeminiConfig;
export function analyzeWithGemini(input: {description: string; imageData: string}, schema: unknown, config: GeminiConfig, fetcher?: typeof fetch): Promise<unknown>;
