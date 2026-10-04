import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';

const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('agribiz_language');
    if (saved && (saved === 'en' || saved === 'mr' || saved === 'hi')) {
      return saved;
    }
  }
  return 'en';
};

const initialLang = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      mr: { translation: mr },
      hi: { translation: hi },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

if (typeof window !== 'undefined') {
  document.documentElement.lang = initialLang;
}

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agribiz_language', lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
