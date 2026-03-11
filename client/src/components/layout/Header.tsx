'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export default function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Tổng quan';
    if (pathname === '/energy') return 'Năng lượng';
    if (pathname === '/sensors') return 'Cảm biến';
    if (pathname?.includes('/devices')) return 'Thiết bị';
    if (pathname?.includes('/automation')) return 'Tự động hóa';
    if (pathname?.includes('/setting')) return 'Cài đặt';
    return 'Dashboard';
  };

  const getPageSubtitle = () => {
    if (pathname === '/dashboard') return 'Giám sát và điều khiển hệ thống Smart Home';
    if (pathname === '/energy') return 'Theo dõi hệ thống năng lượng mặt trời và pin';
    if (pathname === '/sensors') return 'Theo dõi các thông số môi trường từ cảm biến';
    return '';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">{getPageTitle()}</h2>
              {getPageSubtitle() && (
                <p className="hidden sm:block text-xs text-gray-500 mt-0.5">{getPageSubtitle()}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700 font-medium">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all group">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full opacity-75 group-hover:animate-ping"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
