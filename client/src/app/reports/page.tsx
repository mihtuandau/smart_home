'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ExportTools from '@/components/reports/ExportTools';

export default function ReportsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">{t('reports.title')}</h1>
        <p className="page-subtitle">{t('reports.subtitle')}</p>
      </div>

      <ReportGenerator />

      <ExportTools />
    </div>
  );
}
