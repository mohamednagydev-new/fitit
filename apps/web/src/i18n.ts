import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import { api, setApiLang, getAccessToken } from './lib/api';
import { BRAND_LANG, ENGLISH_ONLY } from './lib/brand';

// PULSE is Arabic-first: a new device opens in Arabic and the toggle switches
// to English. An English-only brand build (BRAND_LANG='en', e.g. FIT IT) pins
// the language to English regardless of any stored choice.
const saved = ENGLISH_ONLY ? 'en' : localStorage.getItem('fitit_lang') || BRAND_LANG;

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function applyDir(lang: string) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export function changeLanguage(lang: string) {
  localStorage.setItem('fitit_lang', lang);
  setApiLang(lang);
  i18n.changeLanguage(lang);
  applyDir(lang);
  // Persist to the account first — pushes and reminders are sent in this
  // language — then reload so all cached content re-fetches in the new locale.
  const reload = () => window.location.reload();
  if (getAccessToken()) {
    api.patch('/api/me', { preferredLang: lang }).catch(() => {}).then(reload, reload);
  } else {
    reload();
  }
}

// Apply direction on first load.
applyDir(saved);
setApiLang(saved);

export default i18n;
