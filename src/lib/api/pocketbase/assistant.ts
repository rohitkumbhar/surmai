import { pbAdmin } from './pocketbase.ts';

export const sendTestPrompt = (prompt: string) => {
  return pbAdmin
    .send('/api/surmai/assistant/test-prompt', {
      method: 'POST',
      body: { prompt },
    })
    .then((result) => {
      return result.llmResponse;
    })
    .catch((err) => {
      return err.message || err.toString();
    });
};

export const testImapConnectivity = () => {
  return pbAdmin
    .send('/api/surmai/assistant/test-imap', {
      method: 'POST',
      body: {},
    })
    .then((result) => {
      return result.unreadEmailCount;
    });
};

export const triggerEmailSync = () => {
  return pbAdmin.send('/api/surmai/assistant/email-sync/trigger', {
    method: 'POST',
    body: {},
  });
};
