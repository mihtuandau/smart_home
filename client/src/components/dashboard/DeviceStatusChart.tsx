'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useDevices } from '@/hooks/useDevices';

const DeviceStatusChart: React.FC = () => {
  const { data: devicesData, isLoading, error } = useDevices();

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
        <p className="text-red-600">Không thể tải dữ liệu thiết bị</p>
      </div>
    );
  }

  const devices = (devicesData as any)?.data || [];

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d: any) => d.status === 'online' || d.status === 'on').length;
  const offlineDevices = devices.filter((d: any) => d.status === 'offline' || d.status === 'off').length;

  const statusData = [
    { name: 'Online', value: onlineDevices, color: '#10b981' },
    { name: 'Offline', value: offlineDevices, color: '#ef4444' },
  ];

  const deviceTypes = devices.reduce((acc: any, device: any) => {
    const type = device.type || 'Unknown';
    if (!acc[type]) {
      acc[type] = { type, count: 0, online: 0 };
    }
    acc[type].count++;
    if (device.status === 'online' || device.status === 'on') {
      acc[type].online++;
    }
    return acc;
  }, {});

  const typeData = Object.values(deviceTypes);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-700">{payload[0].name}</p>
          <p className="text-xs text-gray-600 mt-1">
            Số lượng: {payload[0].value} thiết bị
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Trạng thái Thiết bị</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Tổng số</p>
          <p className="text-lg font-bold text-purple-600">
            {totalDevices}
          </p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Online</p>
          <p className="text-lg font-bold text-green-600">
            {onlineDevices}
          </p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Offline</p>
          <p className="text-lg font-bold text-red-600">
            {offlineDevices}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Status Distribution */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            Phân bố trạng thái
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-xs text-gray-600">
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Device Types */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            Phân loại thiết bị
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="type" 
                stroke="#6b7280"
                style={{ fontSize: '10px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '10px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" name="Tổng số" />
              <Bar dataKey="online" fill="#10b981" name="Online" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device List */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Danh sách thiết bị
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {devices.slice(0, 5).map((device: any) => (
            <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  device.status === 'online' || device.status === 'on' 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{device.name}</p>
                  <p className="text-xs text-gray-500">{device.type}</p>
                </div>
              </div>
              <div className="text-xs font-medium">
                <span className={`px-2 py-1 rounded-full ${
                  device.status === 'online' || device.status === 'on'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {device.status === 'online' || device.status === 'on' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
        {devices.length > 5 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            và {devices.length - 5} thiết bị khác...
          </p>
        )}
      </div>
    </div>
  );
};

export default DeviceStatusChart;
