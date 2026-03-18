import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../schemas/auth.schema';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await authService.register(validated);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Cuenta creada exitosamente.',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.login(validated);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    const result = await authService.refresh(validated.refreshToken);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.logout(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente.',
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(validated.email);

    res.status(200).json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(validated.token, validated.password);

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente.',
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user.id, validated);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
