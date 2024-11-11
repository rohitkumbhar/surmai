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
import { SurmaiApp } from './app/Surmai.tsx';

dayjs.extend(localizedFormat);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SurmaiApp />
    </QueryClientProvider>
  </React.StrictMode>
);
