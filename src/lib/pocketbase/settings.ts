import { pbAdmin } from './pocketbase.ts';
import { SmtpSettings } from '../../components/settings/SmtpSettingsForm.tsx';

export const getSmtpSettings = (): Promise<SmtpSettings | undefined> => {
  return pbAdmin.settings.getAll({ fields: 'smtp' }).then((settings) => settings.smtp as SmtpSettings);
};

export const updateSmtpSettings = (settings: SmtpSettings) => {
  return pbAdmin.settings.update({ smtp: settings }).then((settings) => settings.smtp as SmtpSettings);
};
