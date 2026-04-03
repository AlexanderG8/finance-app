'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Users,
  CreditCard,
  Wallet,
  PiggyBank,
  Settings,
  LogOut,
  TrendingUp,
  Bot,
  Menu,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { logoutRequest } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

const navigationItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { href: '/incomes', label: 'Ingresos', icon: TrendingUp, badge: null },
  { href: '/expenses', label: 'Gastos', icon: Receipt, badge: null },
  { href: '/categories', label: 'Categorías', icon: Tag, badge: null },
  { href: '/credit-cards', label: 'Tarjetas', icon: CreditCard, badge: null },
  { href: '/loans', label: 'Préstamos', icon: Users, badge: null },
  { href: '/debts', label: 'Deudas', icon: Wallet, badge: null },
  { href: '/savings', label: 'Ahorros', icon: PiggyBank, badge: null },
  { href: '/ai-chat', label: 'Asistente IA', icon: Bot, badge: 'IA' },
  { href: '/settings', label: 'Configuración', icon: Settings, badge: null },
];

export function MobileMenu() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // Ignore errors
    } finally {
      clearAuth();
      router.push('/login');
    }
  }

  function handleNavClick() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
        <SheetDescription className="sr-only">Accede a las secciones de la aplicación</SheetDescription>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-[#E2E8F0]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F]">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-[#1E3A5F] text-lg">FinanceApp</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#1E3A5F] text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#1E3A5F]'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        isActive ? 'bg-white/20 text-white' : 'bg-[#2E86AB] text-white'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        {user && (
          <div className="border-t border-[#E2E8F0] p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B] truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
