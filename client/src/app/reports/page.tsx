'use client';

import React from 'react';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ExportTools from '@/components/reports/ExportTools';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Xuất dữ liệu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem thống kê tổng hợp và xuất dữ liệu hệ thống
        </p>
      </div>

      <ReportGenerator />

      <ExportTools />
    </div>
  );
}
