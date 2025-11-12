import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { useNetwork } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RouterProvider } from 'react-router-dom';

import { modals } from './modals.ts';
import { buildRouter } from './routes.tsx';
import { SurmaiContext as SurmaiContext1 } from './SurmaiContext.tsx';
import { buildTheme } from './theme.ts';
import { currentUser } from '../lib/api';

import type { SiteSettings } from '../types/settings.ts';

export const SurmaiApp = ({ settings }: { settings: SiteSettings }) => {
  const [primaryColor, setPrimaryColor] = useState<string>('blueGray');
  const { online } = useNetwork();
  const [locale, setLocale] = useState<string>();

  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== 'en-US') {
      switch (i18n.language) {
        case 'es-MX':
          import('dayjs/locale/es-mx')
            .then(() => {
              dayjs.locale('es-mx');
              setLocale('es-mx');
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
              setLocale('fr-FR');
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
              setLocale('ja-JP');
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
              setLocale('de-DE');
            })
            .catch((err) => {
              console.log('could not load locale', err);
            });
          break;
      }
    }
  }, [i18n]);

  useEffect(() => {
    currentUser().then((user) => {
      if (user.colorScheme) {
        setPrimaryColor(user.colorScheme);
      }
    });
  }, []);

  const theme = buildTheme(primaryColor);

  const value = {
    ...settings,
    // The hook doesn't reflect the offline state right away
    // so use the value if set by the launch call
    offline: !online || settings.offline,
    primaryColor,
    changeColor: (colorName: string | undefined) => {
      if (colorName) {
        setPrimaryColor(colorName);
      }
    },
  };

  return (
    <SurmaiContext1 value={value}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <DatesProvider settings={{ locale: locale || 'en' }}>
          <Notifications position={'top-right'} autoClose={5000} />
          <ModalsProvider modals={modals}>
            <RouterProvider router={buildRouter()} />
          </ModalsProvider>
        </DatesProvider>
      </MantineProvider>
    </SurmaiContext1>
  );
};
