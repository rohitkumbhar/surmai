import { RecordModel } from 'pocketbase';

export interface User extends RecordModel {
  id: string;
  email: string;
  name: string;
  currencyCode?: string;
  colorScheme?: string;
  avatar?: string;
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
}

export type AdminSettingsForm = {
  signupsEnabled: boolean;
  smtpServer: string;
  smtpPort: string;
  smtpTls: string;
  smtpUser: string;
  smtpPassword: string;
};
