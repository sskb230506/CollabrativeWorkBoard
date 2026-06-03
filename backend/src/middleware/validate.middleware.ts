import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '@lib/errors';

// ─────────────────────────────────────────────────────────────────────────────
// Zod Validation Middleware Factory
//
// Validates req.body, req.params, or req.query against a Zod schema.
// If validation fails, throws a ValidationError with all field-level details —
// the global error handler formats this into the consistent error envelope.
//
// Usage:
//   router.post('/', validate({ body: CreateBoardSchema }), controller.create)
// ─────────────────────────────────────────────────────────────────────────────

interface ValidationTargets {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validate = (schemas: ValidationTargets) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];

    const targets = [
      { schema: schemas.body,   source: req.body,   name: 'body'   },
      { schema: schemas.params, source: req.params, name: 'params' },
      { schema: schemas.query,  source: req.query,  name: 'query'  },
    ] as const;

    for (const { schema, source, name } of targets) {
      if (!schema) continue;

      const result = schema.safeParse(source);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors.push({
            field: `${name}.${issue.path.join('.')}`,
            message: issue.message,
          });
        });
      } else {
        // Replace the source with the parsed (coerced/stripped) version
        if (name === 'body')   req.body   = result.data;
        if (name === 'params') req.params = result.data as Record<string, string>;
        if (name === 'query')  req.query  = result.data as Record<string, string>;
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Validation failed', errors));
    }

    next();
  };
};
