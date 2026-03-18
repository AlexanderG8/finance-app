'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { forgotPasswordRequest } from '@/lib/auth';

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(data: ForgotFormData) {
    try {
      setServerError(null);
      await forgotPasswordRequest(data.email);
      setSent(true);
    } catch {
      setServerError('Ocurrió un error. Intenta nuevamente.');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A5F]">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#1E3A5F]">FinanceApp</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-[#1E3A5F]">Recuperar contraseña</CardTitle>
            <CardDescription>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Mail className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Si el email está registrado, recibirás un enlace de recuperación en los próximos minutos.
                  Revisa también tu carpeta de spam.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[#2E86AB] hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {serverError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2E86AB]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
