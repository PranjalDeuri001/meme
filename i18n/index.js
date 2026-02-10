import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'mr', 'hi', 'ja', 'nl', 'ml', 'te', 'as', 'bn', 'or', 'pa', 'kn', 'gu'],
    ns: ['translation', 'faults'], // 💡 define namespaces here
    defaultNS: 'translation',      // 💡 default namespace
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // load from multiple namespaces
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
