import PocketBase from 'pocketbase'


const pocketbaseUrl: string = import.meta.env.VITE_POCKETBASE_ENDPOINT || window.location.href
export const pb = new PocketBase(pocketbaseUrl);


