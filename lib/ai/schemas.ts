import { z } from 'zod';
import { categories, severities } from '../types';
export const analysisSchema = z
  .object({
    category: z.enum(categories),
    severity: z.enum(severities),
    summary: z.string().trim().min(10).max(500),
    reasoning: z.string().trim().min(10).max(1500),
  })
  .strict();
export const analysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'string', enum: categories },
    severity: { type: 'string', enum: severities },
    summary: { type: 'string' },
    reasoning: { type: 'string' },
  },
  required: ['category', 'severity', 'summary', 'reasoning'],
};
