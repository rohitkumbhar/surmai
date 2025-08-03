import { createContext } from 'react';
import { SiteSettings } from '../types/settings.ts';

export const SurmaiContext = createContext<
  SiteSettings & {
    primaryColor?: string;
    changeColor?: (colorName: string | undefined) => void;
  }
>({ demoMode: false, emailEnabled: false, signupsEnabled: false, offline: false, version: { tag: 'dev' } });
