import type { RecordModel } from 'pocketbase';

export interface User extends RecordModel {
  id: string;
  email: string;
  name: string;
  currencyCode?: string;
  colorScheme?: string;
  avatar?: string;
  timezone?: string;
  mapsProvider?: string;
  websiteAppearance?: 'light' | 'dark' | 'auto';
  preferredLanguage?: string;
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
  websiteAppearance?: 'light' | 'dark' | 'auto';
  preferredLanguage?: string;
}

export interface OAuthProvider {
  name?: string;
  displayName?: string;
  clientId?: string;
  clientSecret?: string;
  authURL?: string;
  tokenURL?: string;
  userInfoURL?: string;
}

export interface OAuthSettings {
  enabled: boolean;
  providers?: OAuthProvider[];
}
// We only allow 1 OAuth2 provider
export interface OAuthSettingsFormType {
  enabled: boolean;
  name?: string;
  displayName?: string;
  clientId?: string;
  clientSecret?: string;
  authURL?: string;
  tokenURL?: string;
  userInfoURL?: string;
}

export type UserModel = {
  createRule?: string;
  oauth2?: OAuthSettings;
};
