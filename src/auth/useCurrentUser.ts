import { useContext } from 'react';

import { AuthContext } from '@src/auth/AuthContext.ts';

export const useCurrentUser = () => {
  return useContext(AuthContext);
};
