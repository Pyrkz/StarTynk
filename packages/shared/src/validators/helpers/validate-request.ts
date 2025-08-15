import { NextRequest } from 'next/server';
import { z } from 'zod';

export class ValidationError extends Error {
  constructor(public errors: any[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(formatZodError(error));
    }
    throw error;
  }
}

export async function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(formatZodError(error));
    }
    throw error;
  }
}

export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(formatZodError(error));
    }
    throw error;
  }
}

export function formatZodError(error: z.ZodError): any[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}