import { createBrowserRouter } from 'react-router-dom';
import { SecureRoute } from '../auth/SecureRoute.tsx';
import App from '../App.tsx';
import { MyTrips } from '../pages/trips/MyTrips.tsx';
import { Settings } from '../pages/Settings/Settings.tsx';
import { TripsContainer } from '../pages/trips/TripsContainer.tsx';
import { CreateNewTrip } from '../pages/trips/CreateNewTrip.tsx';
import { ViewTrip } from '../pages/trips/ViewTrip.tsx';
import { SignIn } from '../pages/SignIn/SignIn.tsx';
import { SignUp } from '../pages/SignUp/SignUp.tsx';
import { UserProfile } from '../pages/UserProfile/UserProfile.tsx';
import { Invitations } from '../pages/Invitations/Invitations.tsx';

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
          path: '/profile',
          element: <UserProfile />,
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
