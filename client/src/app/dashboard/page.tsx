'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StatsGrid from '@/components/dashboard/StatsGrid';
import EnvironmentStatus from '@/components/dashboard/EnvironmentStatus';
import DeviceControl from '@/components/dashboard/DeviceControl';
import HardwareList from '@/components/dashboard/HardwareList';
import SystemAlert from '@/components/dashboard/SystemAlert';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      
      {/* Stats - Load immediately */}
      <StatsGrid />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environment Status - Load second */}
        <div className="lg:col-span-2">
          <EnvironmentStatus />
        </div>
        
        {/* Device Control - Load second */}
        <div>
          <DeviceControl />
        </div>
      </div>
      
      {/* Hardware List - Load third */}
      <HardwareList />
      
      {/* System Alerts - Load last */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
            </svg>
          </div>
          Thông báo hệ thống
        </h2>
        <SystemAlert />
      </div>
    </div>
  );
}
