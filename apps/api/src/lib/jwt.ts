import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
}

interface JwtPayload extends TokenPayload {
  iat: number;
  exp: number;
}

export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env['JWT_ACCESS_SECRET'];
  const expiresIn = process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m';

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined');
  }

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const secret = process.env['JWT_REFRESH_SECRET'];
  const expiresIn = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d';

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env['JWT_ACCESS_SECRET'];

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined');
  }

  return jwt.verify(token, secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret = process.env['JWT_REFRESH_SECRET'];

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.verify(token, secret) as JwtPayload;
}
