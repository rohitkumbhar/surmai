import { expect, test } from '@tests/e2e/fixtures/test';

/**
 * The admin settings forms are populated from a query inside an effect, and
 * each section is revealed by a useDisclosure whose initial state is read
 * before that query has resolved. These tests reopen the page with settings
 * already saved, which is the case that breaks when those two get out of step:
 * the values are there, but the form shows nothing.
 */
// These settings are single records shared by the whole instance, not per
// user, so these tests cannot run alongside each other or leave changes behind
// for the rest of the suite.
test.describe.configure({ mode: 'serial' });

test.describe('Settings', () => {
  const changed = ['openai_endpoint_config', 'flight_info_provider', 'email_sync_config'];
  const original: Record<string, Record<string, unknown>> = {};

  test.beforeEach(async ({ api }) => {
    for (const key of changed) {
      if (!original[key]) {
        original[key] = await api.readSetting(key);
      }
    }
  });

  test.afterAll(async ({ playwright, baseURL }) => {
    // Put the suite's settings back, since other specs rely on them pointing
    // at the mock services.
    const context = await playwright.request.newContext({ baseURL });
    const { SurmaiApi } = await import('@tests/e2e/fixtures/api');
    const { superuser } = await import('@tests/e2e/fixtures/test');
    const api = await SurmaiApi.asSuperuser(context, superuser.email, superuser.password);
    for (const [key, value] of Object.entries(original)) {
      await api.writeSetting(key, value);
    }
    await context.dispose();
  });
  test('the assistant settings show the saved endpoint', async ({ page, user, api, signInAsSuperuser }) => {
    await api.writeSetting('openai_endpoint_config', {
      enabled: true,
      endpoint: 'https://ai.example.com/v1',
      apiKey: 'saved-key',
      model: 'saved-model',
    });

    await signInAsSuperuser(page, user);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Assistant' }).click();

    await expect(page.getByLabel('Endpoint')).toHaveValue('https://ai.example.com/v1');
    await expect(page.getByLabel('Model')).toHaveValue('saved-model');
  });

  test('the flight provider settings show the saved provider', async ({ page, user, api, signInAsSuperuser }) => {
    await api.writeSetting('flight_info_provider', {
      enabled: true,
      provider: 'flightaware',
      apiKey: 'saved-flight-key',
      baseUrl: '',
    });

    await signInAsSuperuser(page, user);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Integrations' }).click();

    await expect(page.getByLabel('API Key')).toHaveValue('saved-flight-key');
  });

  test('the booking import settings show the saved mailbox', async ({ page, user, api, signInAsSuperuser }) => {
    await api.writeSetting('email_sync_config', {
      enabled: true,
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapUser: 'inbox@example.com',
      imapPassword: 'saved-password',
      filterEmailAddress: 'bookings@example.com',
    });

    await signInAsSuperuser(page, user);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Assistant' }).click();

    await expect(page.getByLabel('IMAP Host')).toHaveValue('imap.example.com');
  });

  // The mail settings live in PocketBase's own settings rather than a record,
  // and their section is revealed by the same pattern.
  test('the mail settings show the saved host', async ({ page, user, api, signInAsSuperuser }) => {
    const before = (await api.readInstanceSettings()).smtp;

    try {
      await api.writeInstanceSettings({
        smtp: { enabled: true, host: 'smtp.example.com', port: 587, username: 'mailer', tls: true },
      });

      await signInAsSuperuser(page, user);
      await page.goto('/settings');
      await page.getByRole('tab', { name: 'Configuration' }).click();

      // these inputs are required, so their accessible name carries the
      // asterisk; the name attribute is unambiguous
      await expect(page.locator('input[name="host"]')).toHaveValue('smtp.example.com');
      await expect(page.locator('input[name="port"]')).toHaveValue('587');
    } finally {
      await api.writeInstanceSettings({ smtp: before });
    }
  });

  test('a disabled setting still shows what was saved', async ({ page, user, api, signInAsSuperuser }) => {
    // Turning a section off must not lose the values behind it: reopening the
    // page and saving again would otherwise write blanks over them.
    await api.writeSetting('openai_endpoint_config', {
      enabled: false,
      endpoint: 'https://ai.example.com/v1',
      apiKey: 'saved-key',
      model: 'saved-model',
    });

    await signInAsSuperuser(page, user);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Assistant' }).click();

    await expect(page.getByLabel('Endpoint')).toHaveValue('https://ai.example.com/v1');
  });

  test('sends a test prompt to the configured model and shows the reply', async ({
    page,
    user,
    api,
    signInAsSuperuser,
  }) => {
    // The tests above leave the endpoint pointing at a made up host, so put
    // it back on the mock before asking it anything.
    await api.writeSetting('openai_endpoint_config', {
      enabled: true,
      endpoint: `${process.env.MOCK_SERVICES_URL || 'http://127.0.0.1:8099'}/openai`,
      apiKey: 'mock-key',
      model: 'mock-model',
    });

    await signInAsSuperuser(page, user);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Assistant' }).click();

    await page.getByRole('button', { name: 'Test Prompt' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Test Prompt' }).fill('Are you there?');
    await dialog.getByRole('button', { name: 'Submit' }).click();

    // The stub stands in for the model; nothing leaves the machine. This test
    // lives here rather than with the other admin specs because the endpoint
    // it uses is an instance-wide setting that this file rewrites.
    await expect(dialog.getByText('The assistant is reachable.')).toBeVisible();
  });
});
