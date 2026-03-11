import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No autorizado. Token no proporcionado.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No autorizado. Token inválido.',
      });
      return;
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'No autorizado. Token inválido o expirado.',
    });
  }
}
