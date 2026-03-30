'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SystemSettings from '@/components/settings/SystemSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfileSettings from '@/components/settings/ProfileSettings';
import PasswordSettings from '@/components/settings/PasswordSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import { Bell, Lock, Settings2, UserCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'system' | 'notifications'>('system');

  const tabs = useMemo(
    () => [
      { id: 'profile' as const, label: t('settings.tabs.profile'), icon: UserCircle2 },
      { id: 'password' as const, label: t('settings.tabs.password'), icon: Lock },
      { id: 'system' as const, label: t('settings.tabs.system'), icon: Settings2 },
      { id: 'notifications' as const, label: t('settings.tabs.notifications'), icon: Bell },
    ],
    [t]
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl">
      <div className="space-y-1">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 sm:gap-6 items-start">
        <div className="section-card p-2.5 sm:p-3.5 lg:sticky lg:top-20 bg-gradient-to-b from-card via-card to-muted/40 border-primary/20 shadow-md">
          <div className="lg:hidden flex gap-2 overflow-x-auto p-1.5 rounded-lg bg-background/70 border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 font-medium rounded-md transition whitespace-nowrap text-sm border ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground border-primary/40 shadow-sm'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex lg:flex-col gap-1.5">
            <p className="px-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('settings.menuTitle')}
            </p>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5 border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary/40 shadow-sm'
                      : 'text-foreground/75 hover:text-foreground hover:bg-background/80 border-transparent'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? 'bg-primary-foreground' : 'bg-transparent group-hover:bg-border'}`} />
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'password' && <PasswordSettings />}
          {activeTab === 'system' && <SystemSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
}
