'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'vi' as Language, name: 'Tiếng Việt', flagSrc: '/icon/flag-vn.png' },
    { code: 'en' as Language, name: 'English (US)', flagSrc: '/icon/flag-us.png' },
    { code: 'zh' as Language, name: '中文', flagSrc: '/icon/flag-zh.png' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentLanguage = languages.find((lang) => lang.code === language);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-none transition-all"
        title={`Current language: ${currentLanguage?.name}`}
        aria-label="Change language"
      >
        <img
          src={currentLanguage?.flagSrc}
          alt={currentLanguage?.name ?? 'Language'}
          className="w-6 h-4 border border-border object-cover"
          loading="lazy"
        />
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-none shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-sm text-left hover:bg-accent rounded-none transition-colors flex items-center gap-2 ${
                language === lang.code ? 'bg-accent font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              <img
                src={lang.flagSrc}
                alt={lang.name}
                className="w-6 h-4 border border-border object-cover"
                loading="lazy"
              />
              <span>{lang.name}</span>
              {language === lang.code && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
