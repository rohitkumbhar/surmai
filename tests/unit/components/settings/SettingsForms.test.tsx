import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@tests/unit/helpers/queryClient.tsx';

import type { ReactElement } from 'react';

vi.mock('@src/lib/api', () => ({
  getSettingsForKey: vi.fn(),
  setSettingsForKey: vi.fn(),
  sendTestPrompt: vi.fn(),
  testImapConnectivity: vi.fn(),
  triggerImportBookingsJob: vi.fn(),
}));

vi.mock('@src/lib/notifications.tsx', () => ({
  showErrorNotification: vi.fn(),
  showSaveSuccessNotification: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_: string, fallback: string) => fallback }),
}));

const api = await import('@src/lib/api');
const { FlightInfoProviderSettings } = await import(
  '@src/components/settings/FlightInfoProviderSettings.tsx'
);
const { OpenAIEndpointConfiguration } = await import(
  '@src/components/settings/OpenAIEndpointConfiguration.tsx'
);
const { ImportBookingsConfiguration } = await import(
  '@src/components/settings/ImportBookingsConfiguration.tsx'
);

const renderSetting = (ui: ReactElement) =>
  render(
    <MantineProvider>
      <QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>
    </MantineProvider>
  );

// Each of these settings is stored with an `enabled` flag alongside the
// credentials it needs. A form that only filled itself in when the flag was
// set showed blank fields for a saved-but-disabled setting, and turning it
// back on wrote those blanks over the stored values.
describe('Settings forms for a setting saved as disabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.setSettingsForKey).mockResolvedValue(undefined as never);
  });

  it('keeps the stored flight info provider when it is re-enabled', async () => {
    vi.mocked(api.getSettingsForKey).mockResolvedValue({
      enabled: false,
      provider: 'flightaware',
      apiKey: 'stored-flight-key',
    } as never);

    renderSetting(<FlightInfoProviderSettings />);

    // Filled in while the setting is still disabled.
    expect(await screen.findByDisplayValue('stored-flight-key')).toBeDefined();

    await userEvent.click(screen.getByRole('switch'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(api.setSettingsForKey).toHaveBeenCalledWith('flight_info_provider', {
        enabled: true,
        provider: 'flightaware',
        apiKey: 'stored-flight-key',
      });
    });
  });

  it('keeps the stored assistant endpoint when it is re-enabled', async () => {
    vi.mocked(api.getSettingsForKey).mockResolvedValue({
      enabled: false,
      endpoint: 'http://ollama:11434/v1',
      apiKey: 'stored-openai-key',
      model: 'gpt-oss:20b',
    } as never);

    renderSetting(<OpenAIEndpointConfiguration />);

    // Filled in while the setting is still disabled.
    expect(await screen.findByDisplayValue('http://ollama:11434/v1')).toBeDefined();
    expect(screen.getByDisplayValue('stored-openai-key')).toBeDefined();
    expect(screen.getByDisplayValue('gpt-oss:20b')).toBeDefined();

    await userEvent.click(screen.getByRole('switch'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(api.setSettingsForKey).toHaveBeenCalledWith('openai_endpoint_config', {
        enabled: true,
        endpoint: 'http://ollama:11434/v1',
        apiKey: 'stored-openai-key',
        model: 'gpt-oss:20b',
      });
    });
  });

  it('keeps the stored mailbox credentials when booking import is re-enabled', async () => {
    vi.mocked(api.getSettingsForKey).mockResolvedValue({
      enabled: false,
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapUser: 'bookings@example.com',
      imapPassword: 'stored-imap-password',
      filterEmailAddress: 'trips@example.com',
    } as never);

    renderSetting(<ImportBookingsConfiguration />);

    // Filled in while the setting is still disabled.
    expect(await screen.findByDisplayValue('imap.example.com')).toBeDefined();
    expect(screen.getByDisplayValue('stored-imap-password')).toBeDefined();

    await userEvent.click(screen.getByRole('switch'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(api.setSettingsForKey).toHaveBeenCalledWith('email_sync_config', {
        enabled: true,
        imapHost: 'imap.example.com',
        imapPort: 993,
        imapUser: 'bookings@example.com',
        imapPassword: 'stored-imap-password',
        filterEmailAddress: 'trips@example.com',
      });
    });
  });

  it('leaves the form closed and empty when there is nothing stored', async () => {
    vi.mocked(api.getSettingsForKey).mockResolvedValue(undefined as never);

    renderSetting(<OpenAIEndpointConfiguration />);

    const toggle = await screen.findByRole('switch');
    expect((toggle as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByDisplayValue('http://ollama:11434/v1')).toBeNull();
  });
});
