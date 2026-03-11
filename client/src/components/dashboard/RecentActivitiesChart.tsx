'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useRecentActivities } from '@/hooks/useDashboard';

interface RecentActivitiesChartProps {
  limit?: number;
}

const RecentActivitiesChart: React.FC<RecentActivitiesChartProps> = ({ limit = 10 }) => {
  const { data, isLoading, error } = useRecentActivities(limit);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-red-200">
        <p className="text-red-600">Không thể tải dữ liệu hoạt động gần đây</p>
      </div>
    );
  }

  const activities = (data as any)?.data || [];

  // Group activities by type
  const activityTypes = activities.reduce((acc: any, activity: any) => {
    const type = activity.type || 'Other';
    if (!acc[type]) {
      acc[type] = { type, count: 0 };
    }
    acc[type].count++;
    return acc;
  }, {});

  const chartData = Object.values(activityTypes);

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
        <div className="text-sm text-gray-500">
          {activities.length} hoạt động
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="type" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" fill="#6366f1" name="Số lượng" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-400">
          Không có dữ liệu hoạt động
        </div>
      )}

      {/* Activity List */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Chi tiết</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.slice(0, 8).map((activity: any, index: number) => (
            <div 
              key={activity.id || index} 
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.description || activity.message || 'Hoạt động hệ thống'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    {activity.type || 'System'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString('vi-VN') : 'Vừa xong'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivitiesChart;
