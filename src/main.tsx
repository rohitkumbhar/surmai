import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import App from "./App.tsx";
import {SecureRoute} from "./auth/SecureRoute.tsx";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import {createTheme, MantineProvider} from '@mantine/core';
import {SignIn} from "./pages/SignIn/SignIn.tsx";
import {SignUp} from "./pages/SignUp/SignUp.tsx";
import {UserProfile} from "./pages/UserProfile/UserProfile.tsx";
import {MyTrips} from "./pages/trips/MyTrips.tsx";
import {CreateNewTrip} from "./pages/trips/CreateNewTrip.tsx";
import {ViewTrip} from "./pages/trips/ViewTrip.tsx";
import {EditTrip} from "./pages/trips/EditTrip.tsx";
import {TripsContainer} from "./pages/trips/TripsContainer.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const theme = createTheme({
  colors: {
    deepBlue: [
      '#eef3ff',
      '#dce4f5',
      '#b9c7e2',
      '#94a8d0',
      '#748dc1',
      '#5f7cb8',
      '#5474b4',
      '#44639f',
      '#39588f',
      '#2d4b81',
    ],
  }
});

const pages = [
  {
    path: "/profile",
    element: <UserProfile/>
  }
]


const router = createBrowserRouter([
  {
    path: "/",
    element: <SecureRoute><App/></SecureRoute>,
    children: [
      ...pages,
      {
        path: "/",
        element: <MyTrips/>
      },
      {
        path: "/trips",
        element: <TripsContainer/>,
        children: [
          {path: "", element: <MyTrips/>},
          {path: "/trips/create", element: <CreateNewTrip/>},
          {path: ":tripId", element: <ViewTrip/>},
          {path: ":tripId/edit", element: <EditTrip/>},
        ]
      },
      {path: "*", element: <p>Child Not Found</p>,},
    ]
  },
  {
    path: "/login",
    element: <SignIn/>
  }, {
    path: "/register",
    element: <SignUp/>
  }
]);

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <RouterProvider router={router}/>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
