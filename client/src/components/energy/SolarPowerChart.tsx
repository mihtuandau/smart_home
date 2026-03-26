'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSolarStats } from '@/hooks/useEnergy';
import { useChartColors } from '@/lib/chartDarkModeUtils';
import { BarChart3 } from 'lucide-react';

export default function SolarPowerChart() {
  const { data, isLoading } = useSolarStats(24);
  const colors = useChartColors();
  
  // Server returns { success, period, data: { totalGenerated, peakPower, averagePower, data: [...] } }
  const solarDataFromAPI = Array.isArray((data as any)?.data?.data) ? (data as any).data.data : [];
  
  const chartData = solarDataFromAPI.map((item: any) => {
    const timestamp = typeof item.timestamp === 'string' 
      ? new Date(item.timestamp) 
      : item.timestamp;
    
    return {
      time: timestamp.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      power: item.power || 0,
    };
  });

  if (isLoading) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6 animate-pulse">
        <div className="h-64"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Công suất Solar Panel</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Công suất phát điện theo thời gian</p>
        </div>
        <div className="h-52 sm:h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Chưa có dữ liệu Solar Panel</p>
            <p className="text-xs text-muted-foreground mt-1">Dữ liệu sẽ xuất hiện khi hệ thống bắt đầu thu thập</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Công suất Solar Panel</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Công suất phát điện theo thời gian</p>
      </div>
      
      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: colors.axisLabelColor }}
              axisLine={{ stroke: colors.axisColor }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: colors.axisLabelColor }}
              axisLine={{ stroke: colors.axisColor }}
              unit="W"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: colors.backgroundColor, 
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '8px',
                fontSize: '12px',
                color: colors.textColor
              }}
              labelStyle={{ color: colors.textColor, fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey="power" 
              stroke="#f59e0b" 
              strokeWidth={2}
              fill="url(#colorPower)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
