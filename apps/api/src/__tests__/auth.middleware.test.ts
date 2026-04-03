import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { verifyAccessToken } from '../lib/jwt';

jest.mock('../lib/jwt');

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
}

function makeRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('authMiddleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ── Sin header ─────────────────────────────────────────────────────────────

  it('debe responder 401 si no hay Authorization header', () => {
    const req = makeReq();
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  // ── Formato incorrecto ──────────────────────────────────────────────────────

  it('debe responder 401 si el header no empieza con "Bearer "', () => {
    const req = makeReq('Basic dXNlcjpwYXNz');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si el header es solo "Bearer " sin token', () => {
    const req = makeReq('Bearer ');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Token inválido / expirado ───────────────────────────────────────────────

  it('debe responder 401 si verifyAccessToken lanza un error (token inválido)', () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = makeReq('Bearer token-invalido');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si verifyAccessToken lanza JsonWebTokenError (token expirado)', () => {
    mockVerifyAccessToken.mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    const req = makeReq('Bearer token-expirado');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Token válido ────────────────────────────────────────────────────────────

  it('debe llamar next() y asignar req.user si el token es válido', () => {
    mockVerifyAccessToken.mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
      iat: 1000,
      exp: 9999,
    });

    const req = makeReq('Bearer token-valido');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'user-123', email: 'test@example.com' });
  });

  it('debe pasar el token correcto a verifyAccessToken (sin el prefijo Bearer)', () => {
    mockVerifyAccessToken.mockReturnValue({
      userId: 'user-abc',
      email: 'user@example.com',
      iat: 0,
      exp: 0,
    });

    const req = makeReq('Bearer mi-token-real');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(mockVerifyAccessToken).toHaveBeenCalledWith('mi-token-real');
  });
});
