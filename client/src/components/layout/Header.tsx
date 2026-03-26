'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Clock3, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export default function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Tổng quan';
    if (pathname === '/energy') return 'Năng lượng';
    if (pathname === '/sensors') return 'Cảm biến';
    if (pathname?.includes('/devices')) return 'Thiết bị';
    if (pathname?.includes('/automation')) return 'Tự động hóa';
    if (pathname?.includes('/settings')) return 'Cài đặt';
    if (pathname?.includes('/reports')) return 'Báo cáo';
    return 'Dashboard';
  };

  const getPageSubtitle = () => {
    if (pathname === '/dashboard') return 'Giám sát và điều khiển hệ thống Smart Home';
    if (pathname === '/energy') return 'Theo dõi hệ thống năng lượng mặt trời và pin';
    if (pathname === '/sensors') return 'Theo dõi các thông số môi trường từ cảm biến';
    if (pathname?.includes('/devices')) return 'Ngắt tắt, bật đèn LED và quản lý thiết bị IoT';
    if (pathname?.includes('/automation')) return 'Tạo và quản lý quy tắc tự động hóa';
    if (pathname?.includes('/settings')) return 'Cấu hình hệ thống và tài khoản';
    if (pathname?.includes('/reports')) return 'Xem báo cáo chi tiết và xuất dữ liệu';
    return '';
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
      <div className="px-3 sm:px-6 py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              aria-label="Toggle sidebar"
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
            {/* Time */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <Clock3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                aria-label="Chuyển theme"
                title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Notifications */}
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
