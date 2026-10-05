import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';

const SAVED_LANG_KEY = 'agribiz_language';
const initialLang = typeof window !== 'undefined' ? (localStorage.getItem(SAVED_LANG_KEY) || 'en') : 'en';

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
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

function updateHtmlLangAttr(lang: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.classList.remove('lang-en', 'lang-mr', 'lang-hi');
    document.documentElement.classList.add(`lang-${lang}`);
  }
}

updateHtmlLangAttr(initialLang);

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAVED_LANG_KEY, lng);
  }
  updateHtmlLangAttr(lng);
});

export default i18n;
