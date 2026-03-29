'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import StatsGrid from '@/components/dashboard/StatsGrid';
import EnvironmentStatus from '@/components/dashboard/EnvironmentStatus';
import QuickLEDControl from '@/components/dashboard/QuickLEDControl';
import LedConsumptionChart from '@/components/dashboard/LedConsumptionChart';
import AIInsights from '@/components/ai/AIInsights';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </div>

      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="order-2 lg:order-1 lg:col-span-2">
          <EnvironmentStatus />
        </div>
        <div className="order-1 lg:order-2">
          <QuickLEDControl />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
