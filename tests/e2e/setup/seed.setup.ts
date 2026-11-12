import { test as setup, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { authenticate, SurmaiApi } from '../fixtures/api';
import { seedReferenceData } from '../fixtures/reference-data';
import { defaultUser, authStoreKey, storageStatePath, superuser } from '../fixtures/test';

const mockServices = process.env.MOCK_SERVICES_URL || 'http://127.0.0.1:8099';

/**
 * Prepares the backend once per run: the reference data the search fields need,
 * the external services pointed at the mock server, and a signed-in session
 * file for the tests that do not need a user of their own.
 *
 * Everything here is idempotent, so a run against an existing backend works.
 */
setup('seed the test backend', async ({ request, baseURL }) => {
  const api = await SurmaiApi.asSuperuser(request, superuser.email, superuser.password);

  await seedReferenceData(api);

  // Flight lookups and the assistant must not reach the real services.
  await api.writeSetting('flight_info_provider', {
    enabled: true,
    provider: 'adsbdb',
    apiKey: '',
    baseUrl: `${mockServices}/adsbdb`,
  });
  await api.writeSetting('openai_endpoint_config', {
    enabled: true,
    endpoint: `${mockServices}/openai`,
    apiKey: 'mock-key',
    model: 'mock-model',
  });

  const existing = await api.listRecords('users', { filter: `email="${defaultUser.email}"` });
  if (existing.totalItems === 0) {
    await api.createUser(defaultUser.email, defaultUser.password, 'Default Test User');
  }

  // Store the session the way the SDK does, so pages start signed in.
  const auth = await authenticate(request, 'users', defaultUser.email, defaultUser.password);
  const origin = baseURL || 'http://localhost:6173';
  const state = {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [{ name: authStoreKey, value: JSON.stringify({ token: auth.token, record: auth.record }) }],
      },
    ],
  };

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  fs.writeFileSync(storageStatePath, JSON.stringify(state, null, 2));

  expect(auth.token).not.toBe('');
});
