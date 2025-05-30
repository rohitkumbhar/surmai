import { createContext, useEffect, useState } from 'react';
import { authRefresh, currentUser } from '../lib/api';
import { User } from '../types/auth.ts';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSurmaiContext } from '../app/useSurmaiContext.ts';

export const AuthContext = createContext<{
  user?: User;
  reloadUser?: () => void;
}>({});

export const SecureRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setCurrentUser] = useState<User>();
  const navigate = useNavigate();
  const location = useLocation();
  const { offline, changeColor } = useSurmaiContext();

  useEffect(() => {
    //Auth Refresh is a POST call and not cached by the service worker, so we need to check if we are offline
    if (!offline && location.pathname !== '/login' && location.pathname !== '/register') {
      authRefresh().catch(() => {
        navigate('/login');
      });
    }
  }, [location, navigate, offline]);

  useEffect(() => {
    currentUser()
      .then((resolvedUser) => setCurrentUser(resolvedUser))
      .catch(() => {
        navigate('/login');
      });
  }, [navigate, offline]);

  useEffect(() => {
    if (user?.colorScheme) {
      changeColor?.(user.colorScheme);
    }
  }, [user, changeColor]);

  const reloadUser = () => {
    authRefresh()
      .then((result) => {
        setCurrentUser(result.record as User);
      })
      .catch(() => navigate('/login'));
  };

  const value = {
    user,
    reloadUser,
  };
  return user ? <AuthContext.Provider value={value}>{children}</AuthContext.Provider> : null;
};
