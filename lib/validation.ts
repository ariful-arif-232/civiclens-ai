import { z } from 'zod';
import { categories, severities, statuses } from './types';
const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().finite().min(min).max(max).nullable(),
  );
export const reportInput = z
  .object({
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(15).max(3000),
    area: z.string().trim().min(2).max(100),
    latitude: optionalNumber(-90, 90),
    longitude: optionalNumber(-180, 180),
  })
  .strict()
  .refine((v) => (v.latitude === null) === (v.longitude === null), {
    message: 'Provide both coordinates or leave both blank',
    path: ['longitude'],
  });
export const filtersInput = z
  .object({
    category: z.enum(categories).optional(),
    severity: z.enum(severities).optional(),
    status: z.enum(statuses).optional(),
    area: z.string().max(100).optional(),
    sort: z.enum(['risk', 'newest']).default('risk'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(24),
  })
  .strict();
export const patchInput = z
  .object({ status: z.enum(statuses), expectedStatus: z.enum(statuses) })
  .strict();
export const transitions: Record<(typeof statuses)[number], readonly (typeof statuses)[number][]> =
  {
    reported: ['under_review'],
    under_review: ['in_progress', 'reported'],
    in_progress: ['resolved', 'under_review'],
    resolved: ['under_review'],
  };
export const uuidInput = z.string().uuid();
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
