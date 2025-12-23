import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { SurmaiApp } from './app/Surmai.tsx';
import './index.css';
import { apiUrl } from './lib/api';
import './lib/i18n';

import type { SiteSettings } from './types/settings.ts';
import { configureI18next } from './lib/i18n.ts';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const queryClient = new QueryClient();

fetch(`${apiUrl}/site-settings.json`, { signal: AbortSignal.timeout(2000) })
  .then((result) => result.json())
  .then(async (settings: SiteSettings) => {
    // This fetch call is cached by the service worker.
    // Setting the offline value from the browser state
    const siteSettings = { ...settings, offline: !navigator.onLine };
    await configureI18next();
    launchApp(siteSettings);
  })

  .catch((error) => {
    // We still need the app in offline mode
    console.log('Could not load site settings', error);
    launchApp({
      demoMode: false,
      emailEnabled: false,
      signupsEnabled: false,
      offline: true,
      version: { tag: 'dev' },
    });
  });

const launchApp = (settings: SiteSettings) => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <SurmaiApp settings={settings} />
      </QueryClientProvider>
    </React.StrictMode>
  );
};
