'use client';

import React from 'react';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ExportTools from '@/components/reports/ExportTools';

export default function ReportsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">Báo cáo & Xuất dữ liệu</h1>
        <p className="page-subtitle">Xem thống kê tổng hợp và xuất dữ liệu hệ thống</p>
      </div>

      <ReportGenerator />

      <ExportTools />
    </div>
  );
}
