import { useContext } from 'react';

import { SurmaiContext } from '@src/app/SurmaiContext.tsx';

export const useSurmaiContext = () => {
  return useContext(SurmaiContext);
};
