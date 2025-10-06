import { useContext } from 'react';

import { AuthContext } from './SecureRoute.tsx';

export const useCurrentUser = () => {
  return useContext(AuthContext);
};
