'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Calculator, Zap, Receipt, TrendingUp, AlertTriangle } from 'lucide-react';

interface BillingForecast {
  month: string;
  kwhSoFar: number;
  projectedKwh: number;
  projectedCostVnd: number;
  ciLow: number;
  ciHigh: number;
  priceVndPerKwh: number;
}

export default function BillingForecastWidget() {
  const [unitPrice, setUnitPrice] = useState<string>('3000');

  const fetchForecast = async (price: string) => {
    const res = await apiClient.request<BillingForecast>(`/ai/forecast?price=${price}`);
    return res;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['billing-forecast', unitPrice],
    queryFn: () => fetchForecast(unitPrice),
    refetchInterval: 60000,
  });

  return (
    <div className="section-card border border-border rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Dự báo Hóa đơn Điện</h3>
            <p className="text-xs text-muted-foreground">Phân tích bằng AI dựa trên xu hướng tải thực tế</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">Đơn giá:</span>
          <div className="relative">
            <input 
              type="number" 
              value={unitPrice} 
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-24 px-3 py-1.5 border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-background"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">VNĐ</span>
          </div>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-xl w-full"></div>
          <div className="flex gap-4">
            <div className="h-16 bg-muted rounded-xl w-1/2"></div>
            <div className="h-16 bg-muted rounded-xl w-1/2"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/20 text-center">
            <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1 flex items-center justify-center gap-1.5">
              <Receipt className="w-4 h-4" />
              Ước tính Hóa đơn Cuối tháng {data.month.split('-')[1]}
            </p>
            <div className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400 tracking-tight">
              {data.projectedCostVnd.toLocaleString('vi-VN')} <span className="text-xl sm:text-2xl text-red-500/70">VNĐ</span>
            </div>
            <p className="text-xs text-red-700/60 dark:text-red-400/60 mt-2 font-medium">
              (Dự kiến: {data.projectedKwh.toFixed(2)} kWh × {data.priceVndPerKwh.toLocaleString()} VNĐ)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Đã dùng tháng này</p>
                <div className="text-lg font-bold text-foreground">
                  {data.kwhSoFar.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">kWh</span>
                  </div>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-start gap-3">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Khoảng dao động 95%</p>
                <div className="text-sm font-bold text-foreground mt-1">
                  {data.ciLow.toFixed(1)} <span className="text-muted-foreground font-normal mx-0.5">-</span> {data.ciHigh.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kWh</span>
                </div>
              </div>
            </div>
          </div>
          
          {data.projectedCostVnd > 500000 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-4 py-3 rounded-xl border border-orange-200 dark:border-orange-800/30 flex gap-2 items-start text-sm mt-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Hệ thống AI nhận thấy xu hướng dùng điện đang cao hơn mức trung bình an toàn. Hãy kiểm tra lại thiết bị tiêu thụ công suất lớn nhé!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
