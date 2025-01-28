import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './lib/i18n';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SurmaiApp } from './app/Surmai.tsx';
import { apiUrl } from './lib/api';
import { SiteSettings } from './types/settings.ts';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const queryClient = new QueryClient();

fetch(`${apiUrl}/site-settings.json`)
  .then((result) => result.json())
  .then((settings: SiteSettings) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <SurmaiApp settings={settings} />
        </QueryClientProvider>
      </React.StrictMode>
    );
  });
