import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { useMediaQuery, useNetwork } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';

import { modals } from './modals.ts';
import { buildRouter } from './routes.tsx';
import { SurmaiContext } from './SurmaiContext.tsx';
import { buildTheme } from './theme.ts';
import i18n from '../lib/i18n.ts';

import type { SiteSettings } from '../types/settings.ts';

export const SurmaiApp = ({ settings }: { settings: SiteSettings }) => {
  const [primaryColor, setPrimaryColor] = useState<string>('blueGray');
  const { online } = useNetwork();
  const theme = buildTheme(primaryColor);
  const isMobile = useMediaQuery('(max-width: 50em)');

  const value = {
    ...settings,
    // The hook doesn't reflect the offline state right away
    // so use the value if set by the launch call
    offline: !online || settings.offline,
    primaryColor,
    isMobile,
    changeColor: (colorName: string | undefined) => {
      if (colorName) {
        setPrimaryColor(colorName);
      }
    },
  };

  return (
    <SurmaiContext value={value}>
      <MantineProvider theme={theme} defaultColorScheme={'auto'}>
        <DatesProvider settings={{ locale: i18n.language }}>
          <Notifications position={'top-right'} autoClose={5000} />
          <ModalsProvider modals={modals}>
            <RouterProvider router={buildRouter()} />
          </ModalsProvider>
        </DatesProvider>
      </MantineProvider>
    </SurmaiContext>
  );
};
