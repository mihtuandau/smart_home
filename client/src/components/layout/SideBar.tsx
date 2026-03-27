'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Activity, Cpu, FileText, House, LogIn, LogOut, Settings, Sun, X } from 'lucide-react';

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

interface DashboardSidebarProps {
  isOpen: boolean;
  user?: {
    username?: string;
    email?: string;
    role?: string;
  } | null;
  onLogout: () => void;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen, user, onLogout, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const normalizedRole = user?.role?.toUpperCase();
  const roleLabel = (() => {
    switch (normalizedRole) {
      case 'ADMIN':
        return t('sidebar.roles.admin');
      case 'USER':
        return t('sidebar.roles.user');
      case 'GUEST':
        return t('sidebar.roles.guest');
      default:
        return normalizedRole || t('sidebar.roles.user');
    }
  })();

  const menuItems: MenuItem[] = [
    { 
      path: '/dashboard', 
      icon: <House className="w-5 h-5" />,
      label: t('dashboard.title')
    },
    { 
      path: '/devices', 
      icon: <Cpu className="w-5 h-5" />,
      label: t('devices.title')
    },
    { 
      path: '/sensors', 
      icon: <Activity className="w-5 h-5" />,
      label: t('sensors.title')
    },
    { 
      path: '/energy', 
      icon: <Sun className="w-5 h-5" />,
      label: t('energy.title')
    },
    
    {
      path: '/reports',
      icon: <FileText className="w-5 h-5" />,
      label: t('reports.title')
    },
    { 
      path: '/settings', 
      icon: <Settings className="w-5 h-5" />,
      label: t('settings.title')
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-[100dvh] transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-gradient-to-b from-card to-muted border-r border-border w-72 max-w-[85vw] shadow-lg md:relative md:translate-x-0 md:z-0 md:w-64`}
      >
      <div className="h-full px-4 py-5 pb-[env(safe-area-inset-bottom,20px)] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center flex-1">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Image 
                src="/images/logo_smart.png" 
                alt="Smart Home Logo" 
                width={44}
                height={44}
                className="rounded-lg"
              />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-foreground">Smart Home</h1>
              <p className="text-xs text-muted-foreground">AI Dashboard</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground md:hidden"
              title={t('sidebar.closeMenu')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose} 
                className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                    : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                }`}
              >
                <div className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}>
                  {item.icon}
                </div>
                <span className="text-base md:text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 mt-4 mb-4 border-t border-border">
          {user ? (
            <div className="flex items-center justify-between bg-card rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.username|| 'User'}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>  
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all"
                title={t('sidebar.logout')}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl p-3.5 shadow-sm hover:bg-blue-700 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              <span className="text-sm font-semibold">{t('sidebar.login')}</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
