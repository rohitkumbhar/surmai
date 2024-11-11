import { createContext, useEffect, useState } from 'react';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { currentUser } from '../lib';
import { buildTheme } from './theme.ts';
import { buildRouter } from './routes.tsx';
import { modals } from './modals.ts';

export const SurmaiContext = createContext<{
  primaryColor?: string;
  changeColor?: (colorName: string | undefined) => void;
}>({});

export const SurmaiApp = () => {
  const [primaryColor, setPrimaryColor] = useState<string>('blueGray');
  useEffect(() => {
    currentUser().then((user) => {
      if (user.colorScheme) {
        setPrimaryColor(user.colorScheme);
      }
    });
  }, []);

  const theme = buildTheme(primaryColor);

  const value = {
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
        <Notifications />
        <ModalsProvider modals={modals}>
          <RouterProvider router={buildRouter()} />
        </ModalsProvider>
      </MantineProvider>
    </SurmaiContext.Provider>
  );
};
