import { pbAdmin } from './pocketbase.ts';
import { SmtpSettings } from '../../components/settings/SmtpSettingsForm.tsx';

export const getSmtpSettings = (): Promise<SmtpSettings | undefined> => {
  return pbAdmin.settings.getAll().then((settings) => {
    return {
      senderName: settings.meta.senderName,
      senderAddress: settings.meta.senderAddress,
      applicationUrl: settings.meta.appURL,
      ...settings.smtp,
    } as SmtpSettings;
  });
};

export const updateSmtpSettings = (settings: SmtpSettings) => {
  const { senderName, senderAddress, applicationUrl, ...smtpsettings } = settings;

  const payload = {
    meta: {
      senderName: senderName,
      senderAddress: senderAddress,
      appURL: applicationUrl,
    },
    smtp: { ...smtpsettings },
  };
  return pbAdmin.settings.update(payload).then((settings) => settings.smtp as SmtpSettings);
};

export const sendTestEmail = () => {
  const email = pbAdmin.authStore.record?.email;
  return pbAdmin.settings.testEmail('_superusers', email, 'verification');
};
