import { pbAdmin } from './pocketbase.ts';
import { SmtpSettings } from '../../components/settings/SmtpSettingsForm.tsx';

export const getSmtpSettings = (): Promise<SmtpSettings | undefined> => {
  return pbAdmin.settings.getAll().then((settings) => {
    return {
      senderName: settings.meta.senderName,
      senderAddress: settings.meta.senderAddress,
      ...settings.smtp,
    } as SmtpSettings;
  });
};

export const updateSmtpSettings = (settings: SmtpSettings) => {

  const { senderName, senderAddress, ...smtpsettings } = settings;

  const payload = {
    meta: {
      senderName: senderName,
      senderAddress: senderAddress,
    },
    smtp: { ...smtpsettings },
  };
  return pbAdmin.settings.update(payload).then((settings) => settings.smtp as SmtpSettings);
};
