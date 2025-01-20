import { pbAdmin } from './pocketbase.ts';

import { SmtpSettings } from '../../../types/settings.ts';

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
