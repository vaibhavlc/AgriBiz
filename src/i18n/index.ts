import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import mr from './locales/mr.json';

// Migrate any saved 'hi' preference to 'en'
const rawSaved = typeof window !== 'undefined' ? localStorage.getItem('agribiz_language') : null;
const savedLanguage = rawSaved === 'hi' ? 'en' : (rawSaved || 'en');
if (rawSaved === 'hi' && typeof window !== 'undefined') {
  localStorage.setItem('agribiz_language', 'en');
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      mr: { translation: mr }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
