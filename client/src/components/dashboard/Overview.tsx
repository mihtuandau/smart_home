import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Thiết bị hoạt động', value: '12/15', icon: '💡', color: 'bg-blue-500' },
    { label: 'Nhiệt độ trung bình', value: '24°C', icon: '🌡️', color: 'bg-green-500' },
    { label: 'Độ ẩm', value: '65%', icon: '💧', color: 'bg-cyan-500' },
    { label: 'Năng lượng tiêu thụ', value: '2.4kW', icon: '⚡', color: 'bg-yellow-500' },
  ];

  const recentActivities = [
    { device: 'Đèn phòng khách', action: 'Bật', time: '5 phút trước', status: 'success' },
    { device: 'Điều hòa phòng ngủ', action: 'Tắt', time: '15 phút trước', status: 'info' },
    { device: 'Màn che cà phê', action: 'Mở', time: '1 giờ trước', status: 'success' },
    { device: 'Đèn sân vườn', action: 'Bật tự động', time: '2 giờ trước', status: 'warning' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Chào mừng trở lại, {user?.username}! 👋</h1>
        <p className="text-blue-100">Hệ thống của bạn đang hoạt động tốt</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{activity.device}</p>
                  <p className="text-sm text-gray-500">{activity.action}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition">
              <div className="text-3xl mb-2">💡</div>
              <p className="text-sm font-medium text-gray-900">Tắt tất cả đèn</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition">
              <div className="text-3xl mb-2">🌙</div>
              <p className="text-sm font-medium text-gray-900">Chế độ ngủ</p>
            </button>
            <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition">
              <div className="text-3xl mb-2">🏠</div>
              <p className="text-sm font-medium text-gray-900">Ra ngoài</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition">
              <div className="text-3xl mb-2">🎬</div>
              <p className="text-sm font-medium text-gray-900">Xem phim</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
