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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Không hiển thị sidebar/header cho trang login
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar isOpen={isSidebarOpen} user={user} onLogout={handleLogout} />

      <div className={`${isSidebarOpen ? 'ml-64' : 'ml-0'} transition-all`}>
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
