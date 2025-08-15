import { z } from 'zod';

export interface FormattedError {
  field: string;
  message: string;
  code?: string;
  expected?: string;
  received?: string;
}

export function formatValidationErrors(error: z.ZodError): FormattedError[] {
  return error.errors.map((err) => {
    const formatted: FormattedError = {
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    };

    if ('expected' in err) {
      formatted.expected = String(err.expected);
    }

    if ('received' in err) {
      formatted.received = String(err.received);
    }

    return formatted;
  });
}

export function groupErrorsByField(
  errors: FormattedError[]
): Record<string, string[]> {
  return errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = [];
    }
    acc[error.field].push(error.message);
    return acc;
  }, {} as Record<string, string[]>);
}