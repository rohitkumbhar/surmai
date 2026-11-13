import { createContext } from 'react';

import type { User } from '@src/types/auth.ts';

export const AuthContext = createContext<{
  user?: User;
  reloadUser?: (authRefreshRequired: boolean) => void;
}>({});
