'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Clock3, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

const dateLocaleMap = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
} as const;

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export default function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard': return t('dashboard.title');
      case '/energy': return t('energy.title');
      case '/sensors': return t('sensors.title');
      default:
        if (pathname?.includes('/devices')) return t('devices.title');
        if (pathname?.includes('/automation')) return t('automation.title');
        if (pathname?.includes('/settings')) return t('settings.title');
        if (pathname?.includes('/reports')) return t('reports.title');
        return t('dashboard.title');
    }
  };

  const getPageSubtitle = () => {
    switch (pathname) {
      case '/dashboard': return t('dashboard.subtitle');
      case '/energy': return t('energy.subtitle');
      case '/sensors': return t('sensors.subtitle');
      default:
        if (pathname?.includes('/devices')) return t('devices.subtitle');
        if (pathname?.includes('/automation')) return t('automation.subtitle');
        if (pathname?.includes('/settings')) return t('settings.subtitle');
        if (pathname?.includes('/reports')) return t('reports.subtitle');
        return '';
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
      <div className="px-3 sm:px-6 py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              aria-label={t('sidebar.closeMenu')}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{getPageTitle()}</h2>
              {getPageSubtitle() && (
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {getPageSubtitle()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <Clock3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">
                {new Date().toLocaleTimeString(dateLocaleMap[language], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                aria-label={t('theme.switchLight')}
                title={theme === 'dark' ? t('theme.switchLight') : t('theme.switchDark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}

            <LanguageSwitcher />

            <button className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all group">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full opacity-75 group-hover:animate-ping"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
