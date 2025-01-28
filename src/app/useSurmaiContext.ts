import { useContext } from 'react';
import { SurmaiContext } from './Surmai.tsx';

export const useSurmaiContext = () => {
  return useContext(SurmaiContext);
};
