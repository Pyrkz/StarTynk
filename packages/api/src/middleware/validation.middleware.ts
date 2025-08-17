import { z } from 'zod';
import { ValidationError } from '../errors';

export function validateRequest<T extends z.ZodSchema>(schema: T) {
  return async function validationMiddleware(request: Request): Promise<z.infer<T>> {
    try {
      const data = await extractRequestData(request);
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    }
  };
}

export function validateBody<T extends z.ZodSchema>(schema: T) {
  return async function bodyValidationMiddleware(request: Request): Promise<z.infer<T>> {
    try {
      const contentType = request.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await request.json();
      } else if (contentType?.includes('multipart/form-data')) {
        const formData = await request.formData();
        data = {};
        for (const [key, value] of (formData as any).entries()) {
          (data as any)[key] = value;
        }
      } else {
        throw new ValidationError('Unsupported content type');
      }

      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    }
  };
}

export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return async function queryValidationMiddleware(request: Request): Promise<z.infer<T>> {
    try {
      const url = new URL(request.url);
      const data = Object.fromEntries(url.searchParams.entries());
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    }
  };
}

export function validateParams<T extends z.ZodSchema>(schema: T) {
  return function paramsValidationMiddleware(params: Record<string, string>): z.infer<T> {
    try {
      return schema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    }
  };
}

async function extractRequestData(request: Request): Promise<any> {
  const method = request.method.toUpperCase();
  
  if (method === 'GET' || method === 'DELETE') {
    const url = new URL(request.url);
    return Object.fromEntries(url.searchParams.entries());
  }

  const contentType = request.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    return await request.json();
  }
  
  if (contentType?.includes('multipart/form-data')) {
    const formData = await request.formData();
    const data: Record<string, any> = {};
    for (const [key, value] of (formData as any).entries()) {
      data[key] = value;
    }
    return data;
  }
  
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    const data: Record<string, any> = {};
    for (const [key, value] of (formData as any).entries()) {
      data[key] = value;
    }
    return data;
  }

  return {};
}