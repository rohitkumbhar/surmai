import {pb} from "./pocketbase.ts";
import {User} from "../../types/auth.ts";
import {ClientResponseError} from "pocketbase";


export const authWithUsernameAndPassword = async ({email, password}: { email: string, password: string }) => {
  const result = await pb.collection("users").authWithPassword(email, password);
  return result.record;
}

export const currentUser = async () => {
  return new Promise<User>((resolve, reject) => {
    if (pb.authStore.isValid) {
      resolve(pb.authStore.model as User)
    } else {
      reject("No logged in user")
    }
  })
}

export const logoutCurrentUser = async () => {
  return new Promise<void>(resolve => {
    pb.authStore.clear();
    resolve();
  })
}

export const createUserWithPassword = async ({email, name, password, passwordConfirm}: {
  email: string,
  name: string,
  password: string,
  passwordConfirm: string
}) => {

  const data = {
    "email": email,
    "emailVisibility": true,
    "password": password,
    "passwordConfirm": passwordConfirm,
    "name": name
  };

  return new Promise<User>((resolve, reject) => {
    pb.collection('users').create(data)
      .then(record => {
        resolve(record as unknown as User)
      })
      .catch((err: ClientResponseError) => {
        const messages = [err.message]
        Object.entries(err.data || {}).forEach(([, val]) => {
          messages.push(val.message)
        })
        reject(messages.join("."))
      });
  })

}