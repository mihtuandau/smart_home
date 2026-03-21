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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="page-title">Cài đặt</h1>
        <p className="page-subtitle">Quản lý thông tin cá nhân và cài đặt hệ thống</p>
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
            className={`px-2 sm:px-4 py-2.5 sm:py-3 font-medium border-b-2 transition whitespace-nowrap text-xs sm:text-sm ${
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
