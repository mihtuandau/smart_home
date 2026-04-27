'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t, language } = useLanguage();

  // Conversion rates
  const CONVERSION_RATES = {
    vnd_to_usd: 24500, // 1 USD = 24,500 VND
    vnd_to_cny: 3550,  // 1 CNY = 3,550 VND
  };

  // Map language to locale for number formatting
  const getLocale = () => {
    switch (language) {
      case 'en':
        return 'en-US';
      case 'zh':
        return 'zh-CN';
      case 'vi':
      default:
        return 'vi-VN';
    }
  };

  // Convert currency based on language
  const convertCurrency = (valueVnd: number): { value: number; currency: string } => {
    switch (language) {
      case 'en':
        return { value: valueVnd / CONVERSION_RATES.vnd_to_usd, currency: 'USD' };
      case 'zh':
        return { value: valueVnd / CONVERSION_RATES.vnd_to_cny, currency: 'CNY' };
      case 'vi':
      default:
        return { value: valueVnd, currency: 'VND' };
    }
  };

  // Format currency display
  const formatCurrency = (valueVnd: number): string => {
    const converted = convertCurrency(valueVnd);
    const currencySymbol = converted.currency === 'USD' ? '$' : converted.currency === 'CNY' ? '¥' : '';
    const formattedValue = converted.value.toLocaleString(locale, { 
      maximumFractionDigits: converted.currency === 'VND' ? 0 : 2,
      minimumFractionDigits: converted.currency === 'VND' ? 0 : 2
    });
    
    if (converted.currency === 'USD' || converted.currency === 'CNY') {
      return `${currencySymbol}${formattedValue}`;
    }
    return `${formattedValue} ${converted.currency}`;
  };

  const locale = getLocale();

  const fetchForecast = async () => {
    const res = await apiClient.request<BillingForecast>(`/ai/forecast`);
    return res;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['billing-forecast'],
    queryFn: fetchForecast,
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
            <h3 className="font-semibold text-base">{t('energy.billingForecast')}</h3>
            <p className="text-xs text-muted-foreground">{t('energy.billingDescription')}</p>
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
              {t('energy.estimatedBill')} {data.month.split('-')[1]}
            </p>
            <div className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400 tracking-tight">
              {formatCurrency(data.projectedCostVnd)}
            </div>
            <p className="text-xs text-red-700/60 dark:text-red-400/60 mt-2 font-medium">
              ({t('ai.projectedLabel')}: {data.projectedKwh.toFixed(2)} kWh × {formatCurrency(data.priceVndPerKwh)})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('energy.usedThisMonth')}</p>
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
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('energy.confidenceInterval')}</p>
                <div className="text-sm font-bold text-foreground mt-1">
                  {data.ciLow.toFixed(1)} <span className="text-muted-foreground font-normal mx-0.5">-</span> {data.ciHigh.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kWh</span>
                </div>
              </div>
            </div>
          </div>
          
          {data.projectedCostVnd > 500000 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-4 py-3 rounded-xl border border-orange-200 dark:border-orange-800/30 flex gap-2 items-start text-sm mt-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{t('energy.highConsumptionWarning')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
