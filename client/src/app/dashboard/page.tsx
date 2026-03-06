'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StatsGrid from '@/components/dashboard/StatsGrid';
import EnvironmentStatus from '@/components/dashboard/EnvironmentStatus';
import DeviceControl from '@/components/dashboard/DeviceControl';
import LedConsumptionChart from '@/components/dashboard/LedConsumptionChart';
import AIInsights from '@/components/ai/AIInsights';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-1">Giám sát nhanh hệ thống smart home của bạn</p>
      </div>

      {/* Stats Overview */}
      <StatsGrid />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EnvironmentStatus />
        </div>
        <div>
          <DeviceControl />
        </div>
      </div>

      {/* AI Insights + LED Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIInsights />
        </div>
        <div className="lg:col-span-2">
          <LedConsumptionChart />
        </div>
      </div>
    </div>
  );
}

