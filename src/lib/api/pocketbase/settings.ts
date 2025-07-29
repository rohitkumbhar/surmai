import { pb, pbAdmin } from './pocketbase.ts';

import { SmtpSettings } from '../../../types/settings.ts';
import { OAuthSettingsFormType, UserModel } from '../../../types/auth.ts';

export const getSmtpSettings = async (): Promise<SmtpSettings | undefined> => {
  const settings = await pbAdmin.settings.getAll();
  return {
    senderName: settings.meta.senderName,
    senderAddress: settings.meta.senderAddress,
    applicationUrl: settings.meta.appURL,
    ...settings.smtp,
  } as SmtpSettings;
};

export const updateSmtpSettings = async (settings: SmtpSettings) => {
  const { senderName, senderAddress, applicationUrl, ...smtpSettings } = settings;

  const payload = {
    meta: {
      senderName: senderName,
      senderAddress: senderAddress,
      appURL: applicationUrl,
    },
    smtp: { ...smtpSettings },
  };
  const settings_2 = await pbAdmin.settings.update(payload);
  return settings_2.smtp as SmtpSettings;
};

export const sendTestEmail = () => {
  const email = pbAdmin.authStore.record?.email;
  return pbAdmin.settings.testEmail('_superusers', email, 'verification');
};

export const getUsersMetadata = (): Promise<UserModel> => {
  return pbAdmin.collections.getOne('users');
};

export const updateUser = (userId: string, data: object) => {
  return pb.collection('users').update(userId, data);
};

export const updateUserAdminAction = (userId: string, data: object) => {
  return pbAdmin.collection('users').update(userId, data);
};

export const deleteUserAdminAction = (userId: string) => {
  return pbAdmin.collection('users').delete(userId);
};

export const updateAdminUser = (data: object) => {
  if (pbAdmin?.authStore?.record?.id) {
    return pbAdmin.collection('_superusers').update(pbAdmin.authStore.record.id, data);
  } else {
    throw Error('Not an admin');
  }
};

export const areSignupsEnabled = () => {
  return pbAdmin.collections.getOne('users').then((usersCollection) => {
    return usersCollection.createRule != null;
  });
};

export const disableUserSignups = () => {
  return pbAdmin.collections.update('users', {
    createRule: null,
  });
};

export const enableUserSignups = () => {
  return pbAdmin.collections.update('users', {
    createRule: '',
  });
};

export const disableOAuth2Provider = () => {
  return pbAdmin.collections.update('users', {
    oauth2: {
      enabled: false,
    },
  });
};

export const setOAuth2Provider = (provider: OAuthSettingsFormType) => {
  if (provider.enabled) {
    return pbAdmin.collections.update('users', {
      oauth2: {
        enabled: provider.enabled,
        providers: [
          {
            name: provider.name,
            displayName: provider.displayName,
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            authURL: provider.authURL,
            tokenURL: provider.tokenURL,
            userInfoURL: provider.userInfoURL,
          },
        ],
      },
    });
  } else {
    return pbAdmin.collections.update('users', {
      oauth2: {
        enabled: provider.enabled,
      },
    });
  }
};

export const sendUserAccountInvitation = (email: string, message: string) => {
  return pbAdmin.send('/api/surmai/settings/invite-user', {
    method: 'POST',
    body: { email: email, message: message },
  });
};

export const getSettingsForKey = <T>(key: string): Promise<T> => {
  return pbAdmin
    .collection('surmai_settings')
    .getOne(key)
    .then((settings) => {
      return settings.value;
    })
    .catch(() => {
      return Promise.resolve();
    });
};

export const setSettingsForKey = (key: string, value: any) => {
  pbAdmin
    .collection('surmai_settings')
    .update(key, {
      value
    })
    .catch(() => {
      return Promise.resolve();
    });
};
