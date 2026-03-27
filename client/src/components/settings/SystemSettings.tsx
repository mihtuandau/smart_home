'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SystemSettings() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="section-card shadow-sm p-4 sm:p-6 md:p-8 space-y-6 bg-card/95">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('settings.systemSettings')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('settings.systemDescription')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background/60 p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground inline-flex items-center gap-2">
              <Sun className="w-4 h-4" />
              {t('common.theme')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('settings.themeDescription')}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 p-1.5 rounded-lg bg-muted border border-border md:self-center">
            {['light', 'dark'].map((themeOption) => (
              <label
                key={themeOption}
                className={`flex items-center gap-1.5 cursor-pointer rounded-md px-2.5 py-1.5 transition-colors ${
                  mounted && currentTheme === themeOption
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={themeOption}
                  checked={mounted ? currentTheme === themeOption : false}
                  onChange={() => setTheme(themeOption)}
                  className="w-3.5 h-3.5 accent-primary"
                  disabled={!mounted}
                />
                <span className="text-sm leading-none">
                  <span className="inline-flex items-center gap-1">
                    {themeOption === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {themeOption === 'light' ? t('common.lightMode') : t('common.darkMode')}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground inline-flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('common.language')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('settings.languageDescription')}
            </p>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
            className="w-full md:w-[220px] px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
