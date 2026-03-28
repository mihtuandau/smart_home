'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { TriangleAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PasswordSettings() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('settings.password.mismatch'));
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error(t('settings.password.tooShort'));
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      toast.success(t('settings.password.updateSuccess'));
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || t('settings.password.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-card shadow-sm p-5 sm:p-7 md:p-8 w-full bg-card/95">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('settings.password.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('settings.password.description')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.password.current')}
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full h-11 px-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.password.new')}
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full h-11 px-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{t('settings.password.minLength')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('settings.password.confirm')}
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full h-11 px-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full px-6 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition font-medium"
        >
          {isLoading ? t('common.loading') : t('settings.password.changeButton')}
        </button>
      </form>

      <div className="mt-6 p-4 bg-muted/60 rounded-lg border border-border">
        <p className="text-xs sm:text-sm text-muted-foreground inline-flex items-start gap-1.5">
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <span><strong className="text-foreground">{t('settings.password.noteTitle')}</strong> {t('settings.password.note')}</span>
        </p>
      </div>
    </div>
  );
}
