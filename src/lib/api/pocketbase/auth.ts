import { pb, pbAdmin } from './pocketbase.ts';
import { User } from '../../../types/auth.ts';
import { ClientResponseError } from 'pocketbase';

export const authWithUsernameAndPassword = async ({ email, password }: { email: string; password: string }) => {
  return pbAdmin.admins
    .authWithPassword(email, password)
    .then(async () => {
      const result = await pbAdmin.send('/impersonate', {
        method: 'POST',
        body: { email: email },
      });
      pb.authStore.save(result.token, result.record);
      return result.record;
    })
    .catch(async () => {
      const result = await pb.collection('users').authWithPassword(email, password);
      return result.record;
    });
};

export const currentUser = async () => {
  return new Promise<User>((resolve, reject) => {
    if (pb.authStore.isValid) {
      resolve(pb.authStore.record as User);
    } else {
      reject('No logged in user');
    }
  });
};

export const logoutCurrentUser = async () => {
  return new Promise<void>((resolve) => {
    pb.authStore.clear();
    pbAdmin.authStore.clear();
    resolve();
  });
};

export const createUserWithPassword = async ({
  email,
  name,
  password,
  passwordConfirm,
}: {
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
}) => {
  const data = {
    email: email,
    emailVisibility: true,
    password: password,
    passwordConfirm: passwordConfirm,
    name: name,
  };

  return new Promise<User>((resolve, reject) => {
    pb.collection('users')
      .create(data)
      .then((record) => {
        resolve(record as unknown as User);
      })
      .catch((err: ClientResponseError) => {
        const messages = [err.message];
        Object.entries(err.data || {}).forEach(([, val]) => {
          if (val.message) {
            messages.push(val.message);
          }
        });
        reject(messages.join('.'));
      });
  });
};

export const isAdmin = () => {
  return pbAdmin.authStore.isSuperuser && pbAdmin.authStore.isValid;
};

export const getUserByEmail = (email: string) => {
  return pb.collection('users').getFirstListItem(`email="${email}"`);
};

export const listAllUsers = (): Promise<User[]> => {
  return pb
    .collection<User>('users')
    .getList(1, 50)
    .then((results) => results.items);
};

export const authRefresh = () => {
  return pb.collection('users').authRefresh();
};

export const adminAuthRefresh = () => {
  return pbAdmin.collection('_superusers').authRefresh();
};

export const updateUserAvatar = (userId: string, file: File | Blob) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return pb.collection('users').update(userId, formData);
};

export const listAuthMethods = () => {
  return pb.collection('users').listAuthMethods();
};

export const startOAuthFlow = (name: string) => {
  return pb.collection('users').authWithOAuth2({
    provider: name,
    createData: {
      emailVisibility: true,
    },
  });
};

export const sendResetPasswordRequest = (email: string) => {
  return pb.collection('users').requestPasswordReset(email);
};
