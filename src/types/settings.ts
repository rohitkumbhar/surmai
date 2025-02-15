export type SmtpSettings = {
  enabled?: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  tls?: boolean;
  localName?: string;
  authMethod?: 'PLAIN' | 'LOGIN';
  senderName?: string;
  senderAddress?: string;
  applicationUrl?: string;
};

export type SiteSettings = {
  demoMode: boolean;
  emailEnabled: boolean;
  signupsEnabled: boolean;
  offline: boolean;
};
