import PocketBase, { LocalAuthStore } from 'pocketbase';

const isProd = import.meta.env.PROD;

// Using location.origin means we can't serve under a sub-path
const pocketBaseUrl: string = isProd
  ? window.location.origin
  : import.meta.env.VITE_POCKETBASE_ENDPOINT;

export const pocketBaseClients = {
  user: new PocketBase(pocketBaseUrl, new LocalAuthStore('pb_user')),
  admin: new PocketBase(pocketBaseUrl, new LocalAuthStore('pb_admin')),
};

export const pb = pocketBaseClients.user;
export const pbAdmin = pocketBaseClients.admin;
