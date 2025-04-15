import { useContext } from 'react';

import { SurmaiContext } from './SurmaiContext.tsx';

export const useSurmaiContext = () => {
  return useContext(SurmaiContext);
};
