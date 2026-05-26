'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n';
import { Globe, Moon, Sun, Zap, Brain, CreditCard, Save, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { settingsService } from '@/services';
import { SystemSettings as SystemSettingsType } from '@/types/settings';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const currentTheme = (theme ?? resolvedTheme) === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await settingsService.getSystemSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error(t('settings.notifications.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [t]);

  const handleUpdate = async (updates: Partial<SystemSettingsType>) => {
    if (!settings) return;
    
    // Update local state for immediate feedback
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      setIsSaving(true);
      await settingsService.updateSystemSettings(updates);
      toast.success(t('settings.notifications.saved'));
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error(t('settings.notifications.saveError'));
      // Rollback on error
      const original = await settingsService.getSystemSettings();
      setSettings(original);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="section-card shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual & Language */}
      <div className="section-card shadow-sm p-4 sm:p-6 md:p-8 bg-card/95">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('settings.systemSettings')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.systemDescription')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Theme */}
          <div className="rounded-xl border border-border bg-background/60 p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                <Sun className="w-4 h-4" />
                {t('common.theme')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{t('settings.themeDescription')}</p>
            </div>
            <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-muted border border-border">
              {['light', 'dark'].map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => setTheme(themeOption)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all ${
                    currentTheme === themeOption
                      ? 'bg-background text-foreground shadow-sm border border-border font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {themeOption === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  {themeOption === 'light' ? t('common.lightMode') : t('common.darkMode')}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="rounded-xl border border-border bg-background/60 p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('common.language')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{t('settings.languageDescription')}</p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </div>

      {/* Energy & AI Settings */}
      <div className="section-card shadow-sm p-4 sm:p-6 md:p-8 bg-card/95">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 inline-flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              {t('settings.energyAiTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('settings.energyAiDescription')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Energy Price */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {t('settings.energyPrice')}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.energyPriceKwh}
                onChange={(e) => setSettings({ ...settings, energyPriceKwh: Number(e.target.value) })}
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button 
                onClick={() => handleUpdate({ energyPriceKwh: settings.energyPriceKwh })}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground italic">* {t('settings.energyPriceHint')}</p>
          </div>

          {/* Power Alert Threshold */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              {t('settings.powerAlertThreshold')}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.powerAlertThreshold}
                onChange={(e) => setSettings({ ...settings, powerAlertThreshold: Number(e.target.value) })}
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button 
                onClick={() => handleUpdate({ powerAlertThreshold: settings.powerAlertThreshold })}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground italic">* {t('settings.powerAlertHint')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
