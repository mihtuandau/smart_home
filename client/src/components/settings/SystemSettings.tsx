'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: '30',
    theme: 'light',
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    dataRetention: '90',
  });

  const handleChange = (key: string, value: string | boolean) => {
    setSettings({ ...settings, [key]: value });
    toast.success('Cài đặt đã lưu!');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt hệ thống</h2>
      </div>

      {/* Auto Refresh */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">🔄 Tự động làm mới dữ liệu</h3>
            <p className="text-sm text-gray-600 mt-1">Tự động cập nhật dữ liệu từ cảm biến</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoRefresh}
              onChange={(e) => handleChange('autoRefresh', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {settings.autoRefresh && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoảng thời gian (giây)
            </label>
            <input
              type="number"
              value={settings.refreshInterval}
              onChange={(e) => handleChange('refreshInterval', e.target.value)}
              min="10"
              max="300"
              className="w-full md:w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Theme */}
      <div className="border-b pb-6">
        <h3 className="font-semibold text-gray-900 mb-3">🎨 Chủ đề</h3>
        <div className="flex gap-4">
          {['light', 'dark'].map((theme) => (
            <label key={theme} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={settings.theme === theme}
                onChange={() => handleChange('theme', theme)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">
                {theme === 'light' ? '☀️ Sáng' : '🌙 Tối'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="border-b pb-6">
        <h3 className="font-semibold text-gray-900 mb-3">🌐 Ngôn ngữ</h3>
        <select
          value={settings.language}
          onChange={(e) => handleChange('language', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>

      {/* Timezone */}
      <div className="border-b pb-6">
        <h3 className="font-semibold text-gray-900 mb-3">🕐 Múi giờ</h3>
        <select
          value={settings.timezone}
          onChange={(e) => handleChange('timezone', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
          <option value="UTC">UTC</option>
          <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
          <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
        </select>
      </div>

      {/* Data Retention */}
      <div className="pb-6">
        <h3 className="font-semibold text-gray-900 mb-3">💾 Lưu giữ dữ liệu</h3>
        <div className="flex gap-2 items-center">
          <select
            value={settings.dataRetention}
            onChange={(e) => handleChange('dataRetention', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="30">30 ngày</option>
            <option value="60">60 ngày</option>
            <option value="90">90 ngày</option>
            <option value="180">6 tháng</option>
            <option value="365">1 năm</option>
          </select>
          <span className="text-sm text-gray-600">Dữ liệu cũ hơn sẽ được xóa</span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-red-600 mb-3">⚠️ Vùng nguy hiểm</h3>
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          🗑️ Xóa tất cả dữ liệu
        </button>
        <p className="text-xs text-red-600 mt-2">Hành động này không thể được hoàn tác</p>
      </div>
    </div>
  );
}
