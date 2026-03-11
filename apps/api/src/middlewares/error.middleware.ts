import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorMiddleware(
  error: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos.',
      details: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = error.statusCode ?? 500;
  const message =
    statusCode === 500 ? 'Error interno del servidor.' : error.message;

  if (statusCode === 500) {
    console.error('[Server Error]', error);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(error.code ? { code: error.code } : {}),
  });
}
