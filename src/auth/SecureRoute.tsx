import { createContext, useContext, useEffect, useState } from 'react';
import { authRefresh, currentUser } from '../lib';
import { User } from '../types/auth.ts';
import { useNavigate } from 'react-router-dom';
import { SurmaiContext } from '../app/Surmai.tsx';

export const AuthContext = createContext<{
  user?: User;
  reloadUser?: () => void;
}>({});

export const SecureRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setCurrentUser] = useState<User>();
  const navigate = useNavigate();
  const { changeColor } = useContext(SurmaiContext);

  useEffect(() => {
    currentUser()
      .then((resolvedUser) => setCurrentUser(resolvedUser))
      .catch(() => navigate('/login'));
  }, []);

  useEffect(() => {
    if (user?.colorScheme) {
      changeColor?.(user.colorScheme);
    }
  }, [user]);

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
