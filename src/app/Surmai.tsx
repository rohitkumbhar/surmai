import { createContext, useEffect, useState } from 'react';
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

export const SurmaiContext = createContext<
  SiteSettings & {
    primaryColor?: string;
    changeColor?: (colorName: string | undefined) => void;
  }
>({ demoMode: false, emailEnabled: false, signupsEnabled: false, offline: false });

export const SurmaiApp = ({ settings }: { settings: SiteSettings }) => {
  const [primaryColor, setPrimaryColor] = useState<string>('blueGray');
  const { online } = useNetwork();

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
    <SurmaiContext.Provider value={value}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <Notifications position={'top-right'} autoClose={5000} />
        <ModalsProvider modals={modals}>
          <RouterProvider router={buildRouter()} />
        </ModalsProvider>
      </MantineProvider>
    </SurmaiContext.Provider>
  );
};
