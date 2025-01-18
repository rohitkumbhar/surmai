import { RecordModel } from 'pocketbase';

export interface User extends RecordModel {
  id: string;
  email: string;
  name: string;
  currencyCode?: string;
  colorScheme?: string;
  avatar?: string;
  timezone?: string;
  mapsProvider?: string;
}

export type SignUpForm = {
  email: string;
  fullName: string;
  password: string;
};

export interface UserSettingsFormType {
  name?: string;
  currencyCode?: string;
  colorScheme?: string;
  timezone?: string;
  mapsProvider?: string;
}
