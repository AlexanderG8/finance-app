'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — solo visible en mobile */}
        <MobileMenu />
        <h1 className="text-lg font-semibold text-[#1E3A5F]">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E63946] text-[10px] text-white font-bold">
            3
          </span>
        </Button>

        {user && (
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}
