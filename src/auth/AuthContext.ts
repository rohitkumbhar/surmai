import { createContext } from 'react';

import type { User } from '../types/auth.ts';

export const AuthContext = createContext<{
  user?: User;
  reloadUser?: (authRefreshRequired: boolean) => void;
}>({});
