import { useEffect, useState } from 'react';
import { User } from '../../types/auth.ts';
import { authRefresh, currentUser } from '../pocketbase/auth.ts';

export const useCurrentUser = () => {

  const [user, setCurrentUser] = useState<User>();

  useEffect(() => {
    currentUser().then((resolvedUser) => setCurrentUser(resolvedUser));
  }, []);

  const reloadUser = () => {
    authRefresh().then(result => {
      console.log("result.record => ", result.record);
      setCurrentUser(result.record as unknown as User);
    });
  };

  return { user, reloadUser };
};