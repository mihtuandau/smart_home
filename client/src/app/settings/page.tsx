'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import ProfileSettings from '@/components/settings/ProfileSettings';
import PasswordSettings from '@/components/settings/PasswordSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Quản lý thông tin cá nhân và cài đặt hệ thống</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1 sm:gap-6 overflow-x-auto">
        {[
          { id: 'profile', label: 'Hồ sơ' },
          { id: 'password', label: 'Mật khẩu' },
          { id: 'system', label: 'Hệ thống' },
          { id: 'notifications', label: 'Thông báo' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 sm:px-4 py-3 font-medium border-b-2 transition whitespace-nowrap text-sm ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'profile' && <ProfileSettings user={user} />}
        {activeTab === 'password' && <PasswordSettings />}
        {activeTab === 'system' && <SystemSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
      </div>
    </div>
  );
}
