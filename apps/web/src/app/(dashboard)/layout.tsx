'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { setAccessToken } from '@/lib/api-client';
import { getStoredRefreshToken, clearStoredRefreshToken, refreshTokenRequest, getMeRequest } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  // Al refrescar la página el access token se pierde (está en memoria).
  // Intentamos renovarlo usando el refresh token guardado en localStorage.
  useEffect(() => {
    if (isAuthenticated) return;

    async function initAuth() {
      const storedRefreshToken = getStoredRefreshToken();
      if (!storedRefreshToken) {
        clearAuth();
        return;
      }
      try {
        const { accessToken } = await refreshTokenRequest(storedRefreshToken);
        setAccessToken(accessToken);
        const user = await getMeRequest();
        setAuth(accessToken, user);
      } catch {
        clearStoredRefreshToken();
        clearAuth();
      }
    }

    initAuth();
  // Solo ejecutar una vez al montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E86AB] border-t-transparent" />
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
