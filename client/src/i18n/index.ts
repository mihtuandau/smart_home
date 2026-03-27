import viTranslations from './locales/vi.json';
import enTranslations from './locales/en.json';

export const translations = {
  vi: viTranslations,
  en: enTranslations,
} as const;

export type Language = 'vi' | 'en';
