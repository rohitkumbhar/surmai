import dayjs from 'dayjs';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

export const supportedLanguages = [
  { label: 'Spanish (Mexico)', value: 'es-MX' },
  { label: 'English (USA)', value: 'en-US' },
  { label: 'French (France)', value: 'fr-FR' },
  { label: 'Japanese (Japan)', value: 'ja-JP' },
  { label: 'German (Germany)', value: 'de-DE' },
];

export const configureI18next = async () => {
  await i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      supportedLngs: supportedLanguages.map((entry) => entry.value),
      fallbackLng: 'en-US',
      debug: false,
      react: {
        // Avoid Suspense in tests and SSR to prevent empty renders
        useSuspense: false,
      },
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
};

export const updateDayJsLanguage = (language: string) => {
  if (language !== 'en-US') {
    switch (language) {
      case 'es-MX':
        import('dayjs/locale/es-mx')
          .then(() => {
            dayjs.locale('es-mx');
          })
          .catch((err) => {
            console.log('could not load locale', err);
          });
        break;
      case 'fr':
      case 'fr-FR':
        import('dayjs/locale/fr')
          .then(() => {
            dayjs.locale('fr');
          })
          .catch((err) => {
            console.log('could not load locale', err);
          });
        break;
      case 'ja':
      case 'ja-JP':
        import('dayjs/locale/ja')
          .then(() => {
            dayjs.locale('ja');
          })
          .catch((err) => {
            console.log('could not load locale', err);
          });
        break;
      case 'de':
      case 'de-DE':
        import('dayjs/locale/de')
          .then(() => {
            dayjs.locale('de');
          })
          .catch((err) => {
            console.log('could not load locale', err);
          });
        break;
    }
  }
};

export default i18n;
