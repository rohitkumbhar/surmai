// import {useEffect, useState} from 'react';
// import {User} from '../types/auth.ts';
// import {authRefresh, currentUser} from '../lib/pocketbase/auth.ts';
//
// export const useCurrentUser = () => {
//
//   const [user, setCurrentUser] = useState<User>();
//
//   useEffect(() => {
//     currentUser().then((resolvedUser) => setCurrentUser(resolvedUser));
//   }, []);
//
//   const reloadUser = () => {
//     authRefresh().then(result => {
//       setCurrentUser(result.record as unknown as User);
//     });
//   };
//
//   return {user, reloadUser};
// };

import { useContext } from 'react';
import { AuthContext } from './SecureRoute.tsx';

export const useCurrentUser = () => {
  return useContext(AuthContext);
};
