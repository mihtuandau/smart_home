'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardSidebar from '@/components/layout/SideBar';
import DashboardHeader from '@/components/layout/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  const protectedPages = ['/automation', '/settings'];
  const isProtectedPage = protectedPages.some(page => pathname?.startsWith(page));

  useEffect(() => {
    if (isProtectedPage && !isAuthenticated && !isLoading) {
      router.replace('/login');
    }
  }, [isProtectedPage, isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-blue-500"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (isProtectedPage && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-blue-500"></div>
          <p className="text-muted-foreground">{t('common.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-background flex-col">
      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        <DashboardSidebar
          isOpen={isSidebarOpen}
          user={user}
          onLogout={handleLogout}
          onClose={handleCloseSidebar}
        />

        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 min-h-0 min-w-0 py-3 sm:py-4 md:py-6 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable_both-edges]">
            <div className="mx-auto w-full max-w-[1400px] min-w-0 px-2 sm:px-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
