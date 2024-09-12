import PocketBase, {LocalAuthStore} from 'pocketbase'


const pocketBaseUrl: string = import.meta.env.VITE_POCKETBASE_ENDPOINT || window.location.href

export const pocketBaseClients = {
  user: new PocketBase(pocketBaseUrl, new LocalAuthStore("pb_user")),
  admin: new PocketBase(pocketBaseUrl, new LocalAuthStore("pb_admin"))
}

export const pb = pocketBaseClients.user;
export const pbAdmin = pocketBaseClients.admin

