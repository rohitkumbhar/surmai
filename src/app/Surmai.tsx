import { useEffect, useState } from 'react';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { currentUser } from '../lib/api';
import { buildTheme } from './theme.ts';
import { buildRouter } from './routes.tsx';
import { modals } from './modals.ts';
import { SiteSettings } from '../types/settings.ts';
import { useNetwork } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { SurmaiContext as SurmaiContext1 } from './SurmaiContext.tsx';
import { DatesProvider } from '@mantine/dates';

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
              console.log('es-mx loaded');
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
              console.log('fr loaded');
              dayjs.locale('fr');
              setLocale('fr-FR');
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
    offline: !online,
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
