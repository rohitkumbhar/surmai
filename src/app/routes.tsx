/* This file is the route table rather than a component module, so the fast
   refresh rule about exporting only components does not apply. */
/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import App from '@src/App.tsx';
import { SecureRoute } from '@src/auth/SecureRoute.tsx';
import { SignIn } from '@src/pages/SignIn/SignIn.tsx';
import { SignUp } from '@src/pages/SignUp/SignUp.tsx';
import { CreateNewTrip } from '@src/pages/trips/CreateNewTrip.tsx';
import { MyTrips } from '@src/pages/trips/MyTrips.tsx';
import { TripsContainer } from '@src/pages/trips/TripsContainer.tsx';
import { ViewTrip } from '@src/pages/trips/ViewTrip.tsx';
import { UserProfile } from '@src/pages/UserProfile/UserProfile.tsx';

const Settings = lazy(() => import('@src/pages/Settings/Settings.tsx'));
const ManageTravellerProfiles = lazy(() => import('@src/pages/TravellerProfiles/ManageTravellerProfiles.tsx'));
const TravelBoard = lazy(() => import('@src/pages/TravelBoard/TravelBoard.tsx'));
const Invitations = lazy(() => import('@src/pages/Invitations/Invitations.tsx'));

export const buildRouter = () => {
  return createBrowserRouter([
    {
      path: '/',
      element: (
        <SecureRoute>
          <App />
        </SecureRoute>
      ),
      children: [
        {
          path: '/',
          element: <MyTrips />,
        },
        {
          path: '/travel-board',
          element: <TravelBoard />,
        },
        {
          path: '/profile',
          element: <UserProfile />,
        },
        {
          path: '/travellers',
          element: <ManageTravellerProfiles />,
        },
        {
          path: '/invitations',
          element: <Invitations />,
        },
        {
          path: '/settings',
          element: <Settings />,
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
};
