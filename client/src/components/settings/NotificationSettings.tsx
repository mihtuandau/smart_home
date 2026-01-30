'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    deviceAlerts: true,
    automationAlerts: true,
    systemAlerts: true,
    energyAlerts: true,
    dailyReport: true,
  });

  const handleChange = (key: string, value: boolean) => {
    setNotifications({ ...notifications, [key]: value });
    toast.success('Cài đặt thông báo đã lưu!');
  };

  const notificationOptions = [
    {
      key: 'emailAlerts',
      icon: '📧',
      label: 'Email Alerts',
      description: 'Nhận email khi có sự cố hoặc cảnh báo',
    },
    {
      key: 'pushNotifications',
      icon: '📲',
      label: 'Push Notifications',
      description: 'Thông báo đẩy trên trình duyệt',
    },
    {
      key: 'deviceAlerts',
      icon: '🔌',
      label: 'Device Alerts',
      description: 'Thông báo khi thiết bị bị lỗi hoặc ngắt kết nối',
    },
    {
      key: 'automationAlerts',
      icon: '🤖',
      label: 'Automation Alerts',
      description: 'Thông báo khi quy tắc tự động được kích hoạt',
    },
    {
      key: 'systemAlerts',
      icon: '⚠️',
      label: 'System Alerts',
      description: 'Cảnh báo hệ thống quan trọng',
    },
    {
      key: 'energyAlerts',
      icon: '⚡',
      label: 'Energy Alerts',
      description: 'Thông báo về tiêu thụ năng lượng bất thường',
    },
    {
      key: 'dailyReport',
      icon: '📊',
      label: 'Daily Report',
      description: 'Báo cáo tóm tắt hàng ngày',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cài đặt thông báo</h2>
        <p className="text-gray-600">Chọn loại thông báo bạn muốn nhận</p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {option.icon} {option.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={notifications[option.key as keyof typeof notifications]}
                onChange={(e) => handleChange(option.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>

      {/* Quiet Hours */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">🔇 Giờ yên tĩnh</h3>
        <p className="text-sm text-gray-600 mb-4">
          Không gửi thông báo trong khoảng thời gian này (trừ cảnh báo khẩn cấp)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ
            </label>
            <input type="time" defaultValue="22:00" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến
            </label>
            <input type="time" defaultValue="06:00" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Email Frequency */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">📧 Tần suất Email</h3>

        <select className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="real-time">🔴 Real-time (Ngay lập tức)</option>
          <option value="hourly">Mỗi giờ</option>
          <option value="daily">Hàng ngày</option>
          <option value="weekly">Hàng tuần</option>
          <option value="never">Không bao giờ</option>
        </select>
      </div>
    </div>
  );
}
