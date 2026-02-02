'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StatsGrid from '@/components/dashboard/StatsGrid';
import EnvironmentStatus from '@/components/dashboard/EnvironmentStatus';
import DeviceControl from '@/components/dashboard/DeviceControl';
import EnergyChart from '@/components/dashboard/EnergyChart';
import LightIntensityChart from '@/components/dashboard/LightIntensityChart';
import TemperatureHumidityChart from '@/components/dashboard/TemperatureHumidityChart';
import DeviceStatusChart from '@/components/dashboard/DeviceStatusChart';
import RecentActivitiesChart from '@/components/dashboard/RecentActivitiesChart';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      
      <StatsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EnvironmentStatus />
        </div>
        <div>
          <DeviceControl />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Phân tích & Thống kê
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <EnergyChart hours={24} />
          <TemperatureHumidityChart hours={24} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <LightIntensityChart hours={24} />
          <DeviceStatusChart />
        </div>

        <RecentActivitiesChart limit={10} />
      </div>
    </div>
  );
}
