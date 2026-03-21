'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/layout/SideBar';
import DashboardHeader from '@/components/layout/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

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

  return (
    <div className="flex h-screen bg-gray-50">
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
  );
}
