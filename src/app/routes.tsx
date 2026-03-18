import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import App from '../App.tsx';
import { SecureRoute } from '../auth/SecureRoute.tsx';
import { SignIn } from '../pages/SignIn/SignIn.tsx';
import { SignUp } from '../pages/SignUp/SignUp.tsx';
import { CreateNewTrip } from '../pages/trips/CreateNewTrip.tsx';
import { MyTrips } from '../pages/trips/MyTrips.tsx';
import { TripsContainer } from '../pages/trips/TripsContainer.tsx';
import { ViewTrip } from '../pages/trips/ViewTrip.tsx';
import { UserProfile } from '../pages/UserProfile/UserProfile.tsx';

const Settings = lazy(() => import('../pages/Settings/Settings.tsx'));
const ManageTravellerProfiles = lazy(() => import('../pages/TravellerProfiles/ManageTravellerProfiles.tsx'));
const TravelBoard = lazy(() => import('../pages/TravelBoard/TravelBoard.tsx'));
const Invitations = lazy(() => import('../pages/Invitations/Invitations.tsx'));

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
