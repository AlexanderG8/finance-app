'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Configuración" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#1E3A5F]">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name} />
                <AvatarFallback className="text-lg">
                  {user ? getInitials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-[#1E293B]">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input defaultValue={user?.name ?? ''} placeholder="Tu nombre" />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={user?.email ?? ''} disabled className="bg-slate-50" />
              <p className="text-xs text-slate-400">El email no se puede cambiar.</p>
            </div>

            <Button>Guardar cambios</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#1E3A5F]">Preferencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1E293B]">Moneda preferida</p>
                <p className="text-xs text-slate-500">
                  Moneda actual: {user?.preferredCurrency ?? 'PEN'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
