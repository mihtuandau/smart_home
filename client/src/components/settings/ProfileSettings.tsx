'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { User } from '@/types';

interface ProfileSettingsProps {
  user: User | null;
}

interface ErrorWithMessage {
  message?: string;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.request('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
        }),
      });

      toast.success(t('settings.profile.updateSuccess'));
      setIsEditing(false);
    } catch (error: unknown) {
      toast.error((error as ErrorWithMessage)?.message || t('settings.profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-card shadow-sm p-4 sm:p-6 md:p-8 space-y-6 bg-card/95">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('settings.profile.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.profile.description')}</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3.5 sm:px-4 py-2 rounded-lg transition text-sm font-medium ${
            isEditing
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          {isEditing ? t('common.cancel') : t('settings.profile.edit')}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.profile.username')}
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full h-11 px-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.profile.email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-11 px-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 px-6 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition font-medium"
            >
              {isLoading ? t('common.loading') : t('settings.profile.saveChanges')}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('settings.profile.username')}</p>
              <p className="text-base sm:text-lg font-medium text-foreground break-all">{formData.username || '--'}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('settings.profile.email')}</p>
              <p className="text-base sm:text-lg font-medium text-foreground break-all">{formData.email || '--'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">{t('settings.profile.role')}</p>
            <span className="inline-block px-3 py-1 bg-primary/10 text-foreground rounded-full text-sm font-medium border border-border">
              {user?.role || 'USER'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
