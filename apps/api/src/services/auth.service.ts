import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail } from '../lib/mailer';
import type {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  PushTokenInput,
} from '../schemas/auth.schema';

const SALT_ROUNDS = 12;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  preferredCurrency: string;
  timezone: string;
  emailVerified: boolean;
  createdAt: Date;
}

interface LoginResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

function formatUser(user: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  preferredCurrency: string;
  timezone: string;
  emailVerified: boolean;
  createdAt: Date;
}): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    preferredCurrency: user.preferredCurrency,
    timezone: user.timezone,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export async function register(input: RegisterInput): Promise<LoginResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    const error = new Error('El email ya está registrado.') as Error & { statusCode: number; code: string };
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  });

  const tokens = {
    accessToken: generateAccessToken({ userId: user.id, email: user.email }),
    refreshToken: generateRefreshToken({ userId: user.id, email: user.email }),
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user.name, user.email).catch((err) => {
    console.error('Failed to send welcome email:', err);
  });

  return {
    user: formatUser(user),
    tokens,
  };
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    const error = new Error('Credenciales inválidas.') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    const error = new Error('Credenciales inválidas.') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  const tokens = {
    accessToken: generateAccessToken({ userId: user.id, email: user.email }),
    refreshToken: generateRefreshToken({ userId: user.id, email: user.email }),
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return {
    user: formatUser(user),
    tokens,
  };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.refreshToken !== refreshToken) {
    const error = new Error('Refresh token inválido o expirado.') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });

  return { accessToken };
}

export async function logout(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export async function getProfile(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error('Usuario no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return formatUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.preferredCurrency !== undefined ? { preferredCurrency: input.preferredCurrency } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    },
  });

  return formatUser(user);
}

export async function registerPushToken(userId: string, input: PushTokenInput): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { expoPushToken: input.token },
  });
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (!user) return;

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expires,
    },
  });

  const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail(email, resetUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    const error = new Error('El token es inválido o ha expirado.') as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      refreshToken: null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  // Send confirmation email (non-blocking)
  sendPasswordResetSuccessEmail(user.email, user.name).catch((err) => {
    console.error('Failed to send password reset success email:', err);
  });
}
