import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../lib/jwt';

// ─── Constantes de test ──────────────────────────────────────────────────────

const ACCESS_SECRET = 'test-access-secret-minimum-32-characters-ok';
const REFRESH_SECRET = 'test-refresh-secret-minimum-32-characters-ok';
const PAYLOAD = { userId: 'user-abc-123', email: 'test@example.com' };

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeAll(() => {
  process.env['JWT_ACCESS_SECRET'] = ACCESS_SECRET;
  process.env['JWT_REFRESH_SECRET'] = REFRESH_SECRET;
  process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
  process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
});

afterAll(() => {
  delete process.env['JWT_ACCESS_SECRET'];
  delete process.env['JWT_REFRESH_SECRET'];
  delete process.env['JWT_ACCESS_EXPIRES_IN'];
  delete process.env['JWT_REFRESH_EXPIRES_IN'];
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('generateAccessToken / verifyAccessToken', () => {
  it('debe generar un token que verifyAccessToken puede decodificar', () => {
    const token = generateAccessToken(PAYLOAD);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(PAYLOAD.userId);
    expect(decoded.email).toBe(PAYLOAD.email);
  });

  it('debe incluir iat y exp en el payload decodificado', () => {
    const token = generateAccessToken(PAYLOAD);
    const decoded = verifyAccessToken(token);

    expect(typeof decoded.iat).toBe('number');
    expect(typeof decoded.exp).toBe('number');
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it('debe lanzar error con un token manipulado (firma inválida)', () => {
    const token = generateAccessToken(PAYLOAD);
    const tampered = token.slice(0, -5) + 'XXXXX';

    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('debe lanzar error con un string que no es un JWT', () => {
    expect(() => verifyAccessToken('no-es-un-jwt')).toThrow();
  });

  it('debe lanzar error si JWT_ACCESS_SECRET no está definido al generar', () => {
    const saved = process.env['JWT_ACCESS_SECRET'];
    delete process.env['JWT_ACCESS_SECRET'];

    expect(() => generateAccessToken(PAYLOAD)).toThrow('JWT_ACCESS_SECRET is not defined');

    process.env['JWT_ACCESS_SECRET'] = saved;
  });

  it('debe lanzar error si JWT_ACCESS_SECRET no está definido al verificar', () => {
    const token = generateAccessToken(PAYLOAD);

    const saved = process.env['JWT_ACCESS_SECRET'];
    delete process.env['JWT_ACCESS_SECRET'];

    expect(() => verifyAccessToken(token)).toThrow('JWT_ACCESS_SECRET is not defined');

    process.env['JWT_ACCESS_SECRET'] = saved;
  });

  it('debe rechazar un access token firmado con el refresh secret', () => {
    // Genera con refresh secret, intenta verificar como access token
    const refreshToken = generateRefreshToken(PAYLOAD);

    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });
});

describe('generateRefreshToken / verifyRefreshToken', () => {
  it('debe generar un refresh token que verifyRefreshToken puede decodificar', () => {
    const token = generateRefreshToken(PAYLOAD);
    const decoded = verifyRefreshToken(token);

    expect(decoded.userId).toBe(PAYLOAD.userId);
    expect(decoded.email).toBe(PAYLOAD.email);
  });

  it('debe lanzar error con un token manipulado', () => {
    const token = generateRefreshToken(PAYLOAD);
    const tampered = token.slice(0, -5) + 'XXXXX';

    expect(() => verifyRefreshToken(tampered)).toThrow();
  });

  it('debe lanzar error si JWT_REFRESH_SECRET no está definido al generar', () => {
    const saved = process.env['JWT_REFRESH_SECRET'];
    delete process.env['JWT_REFRESH_SECRET'];

    expect(() => generateRefreshToken(PAYLOAD)).toThrow('JWT_REFRESH_SECRET is not defined');

    process.env['JWT_REFRESH_SECRET'] = saved;
  });

  it('debe rechazar un refresh token verificado como access token', () => {
    const accessToken = generateAccessToken(PAYLOAD);

    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});
