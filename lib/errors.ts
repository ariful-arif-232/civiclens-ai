import { ZodError } from 'zod';
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      {
        error: 'Please check the submitted fields.',
        details: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    );
  if (error instanceof AppError)
    return Response.json({ error: error.message }, { status: error.status });
  return Response.json(
    { error: 'The request could not be completed. Please try again.' },
    { status: 500 },
  );
}
