'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { Language, translations } from '@/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function normalizeLanguage(value: string | null): Language | null {
  if (!value) return null;
  if (value === 'vi' || value === 'en' || value === 'zh') return value;
  if (value === 'ko' || value === 'zh-cn' || value === 'zh-tw' || value === 'cn') return 'zh';
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    const savedLanguage = normalizeLanguage(localStorage.getItem('language'));
    const browserLanguage = navigator.language.split('-')[0];
    const browserDefault: Language =
      normalizeLanguage(browserLanguage) ??
      (browserLanguage === 'en' ? 'en' : browserLanguage === 'zh' ? 'zh' : 'vi');

    const initialLang = savedLanguage || browserDefault;
    setLanguageState(initialLang);
    document.documentElement.lang = initialLang;
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  };

  const t = useMemo(() => {
    return (key: string, defaultValue?: string): string => {
      const keys = key.split('.');
      let value: unknown = translations[language];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return defaultValue || key;
        }
      }

      return typeof value === 'string' ? value : defaultValue || key;
    };
  }, [language]);

  const contextValue: LanguageContextType = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
