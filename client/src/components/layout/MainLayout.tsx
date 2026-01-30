'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default false on mobile

  // Không hiển thị sidebar/header cho trang login
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

      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
