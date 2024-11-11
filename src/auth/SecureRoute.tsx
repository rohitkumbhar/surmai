import { createContext, useEffect, useState } from 'react';
import { authRefresh, currentUser } from '../lib';
import { User } from '../types/auth.ts';
import { SignIn } from '../pages/SignIn/SignIn.tsx';

export const AuthContext = createContext<{
  user?: User;
  reloadUser?: () => void;
}>({});

export const SecureRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setCurrentUser] = useState<User>();

  useEffect(() => {
    currentUser().then((resolvedUser) => setCurrentUser(resolvedUser));
  }, []);

  const reloadUser = () => {
    authRefresh().then((result) => {
      setCurrentUser(result.record as unknown as User);
    });
  };

  const value = {
    user,
    reloadUser,
  };

  return user ? (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  ) : (
    <SignIn />
  );
};
