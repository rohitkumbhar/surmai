import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthContext } from './AuthContext';
import { useSurmaiContext } from '../app/useSurmaiContext.ts';
import { authRefresh, currentUser, watchUserChanges } from '../lib/api';

import type { User } from '../types/auth.ts';

export const SecureRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setCurrentUser] = useState<User>();
  const navigate = useNavigate();
  const location = useLocation();
  const { offline } = useSurmaiContext();
  const [renderCount, setRenderCount] = useState<number>(0);

  useEffect(() => {
    //Auth Refresh is a POST call and not cached by the service worker, so we need to
    // check if we are offline
    if (!offline && location.pathname !== '/login' && location.pathname !== '/register') {
      authRefresh().catch(() => {
        navigate('/login');
      });
    }
  }, [location, navigate, offline]);

  useEffect(() => {
    currentUser()
      .then((resolvedUser) => {
        setCurrentUser(resolvedUser);
        watchUserChanges((changedUser) => {
          setCurrentUser(changedUser);
        });
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const reloadUser = (authRefreshRequired: boolean = true) => {
    if (authRefreshRequired) {
      authRefresh()
        .then((result) => {
          setCurrentUser(result.record as User);
          setRenderCount(renderCount + 1);
        })
        .catch(() => navigate('/login'));
    } else {
      setRenderCount(renderCount + 1);
    }
  };

  const value = {
    user,
    reloadUser,
    renderCount,
  };
  return user ? <AuthContext.Provider value={value}>{children}</AuthContext.Provider> : null;
};
