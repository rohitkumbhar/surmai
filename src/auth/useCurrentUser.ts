import { useContext } from 'react';

import { AuthContext } from './AuthContext.ts';

export const useCurrentUser = () => {
  return useContext(AuthContext);
};
