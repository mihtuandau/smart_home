import viTranslations from './locales/vi.json';
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

export const translations = {
  vi: viTranslations,
  en: enTranslations,
  zh: zhTranslations,
} as const;

export type Language = 'vi' | 'en' | 'zh';
