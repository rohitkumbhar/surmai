import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import { SecureRoute } from './auth/SecureRoute.tsx';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { createTheme, MantineProvider } from '@mantine/core';
import { SignIn } from './pages/SignIn/SignIn.tsx';
import { SignUp } from './pages/SignUp/SignUp.tsx';
import { MyTrips } from './pages/trips/MyTrips.tsx';
import { CreateNewTrip } from './pages/trips/CreateNewTrip.tsx';
import { ViewTrip } from './pages/trips/ViewTrip.tsx';
import { TripsContainer } from './pages/trips/TripsContainer.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './lib/i18n';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { CarRentalForm } from './components/trip/transportation/CarRentalForm';
import { GenericTransportationModeForm } from './components/trip/transportation/GenericTransportationModeForm';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { EditBasicInfoForm } from './components/trip/basic/EditBasicInfoForm.tsx';
import { UploadImageForm } from './components/upload/UploadImageForm.tsx';
import { Collaborators } from './components/trip/basic/Collaborators.tsx';
import { GenericLodgingForm } from './components/trip/lodging/GenericLodgingForm.tsx';
import { AttachmentViewer } from './components/trip/attachments/AttachmentViewer.tsx';
import { Settings } from './pages/Settings/Settings.tsx';

dayjs.extend(localizedFormat);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const theme = createTheme({
  fontFamily: 'Lato, Verdana, sans-serif',
  colors: {
    salmon: [
      '#f7f3f3',
      '#e6e4e4',
      '#cfc6c6',
      '#b9a5a5',
      '#a58988',
      '#9b7776',
      '#966d6d',
      '#835d5d',
      '#765252',
      '#694545',
    ],
    blueGray: [
      '#f2f4f7',
      '#e4e5e8',
      '#c5c9d2',
      '#a3abbc',
      '#8792a9',
      '#75829e',
      '#6b7a99',
      '#5b6886',
      '#4f5c78',
      '#41506c',
    ],
  },
  primaryColor: 'blueGray',
});

const pages = [
  {
    path: '/settings',
    element: <Settings />,
  },
];

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <SecureRoute>
        <App />
      </SecureRoute>
    ),
    children: [
      ...pages,
      {
        path: '/',
        element: <MyTrips />,
      },
      {
        path: '/trips',
        element: <TripsContainer />,
        children: [
          { path: '', element: <MyTrips /> },
          { path: '/trips/create', element: <CreateNewTrip /> },
          { path: ':tripId', element: <ViewTrip /> },
        ],
      },
      { path: '*', element: <p>Child Not Found</p> },
    ],
  },
  {
    path: '/login',
    element: <SignIn />,
  },
  {
    path: '/register',
    element: <SignUp />,
  },
]);

const queryClient = new QueryClient();

const modals = {
  editBasicInfoForm: EditBasicInfoForm,
  uploadImageForm: UploadImageForm,
  carRentalForm: CarRentalForm,
  genericTransportationForm: GenericTransportationModeForm,
  collaboratorsForm: Collaborators,
  genericLodgingForm: GenericLodgingForm,
  attachmentViewer: AttachmentViewer,
};

declare module '@mantine/modals' {
  export interface MantineModalsOverride {
    modals: typeof modals;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <Notifications />
        <ModalsProvider modals={modals}>
          <RouterProvider router={router} />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
