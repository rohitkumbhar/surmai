import { test as base, expect, request as playwrightRequest } from '@playwright/test';

import { isoDay, SurmaiApi, unique } from './api';

import type { SeededUser, TripInput } from './api';
import type { APIRequestContext, Page } from '@playwright/test';

export const superuser = {
  email: process.env.SURMAI_ADMIN_EMAIL || 'admin@test.surmai.app',
  password: process.env.SURMAI_ADMIN_PASSWORD || 'uf3u2uo3f3uuo23#$#WAIT',
};

export const defaultUser = {
  email: process.env.TEST_USER_EMAIL || 'user@test.surmai.app',
  password: process.env.TEST_USER_PASSWORD || 'e2e-password-1234',
};

export const storageStatePath = 'tests/playwright/.auth/user.json';

/** The session file the SDK reads, so a page starts already signed in. */
export const authStoreKey = 'pb_user';

export type Fixtures = {
  /** The REST API as the superuser, for seeding. */
  api: SurmaiApi;
  /** A user of this test's own, so tests never share state. */
  user: SeededUser;
  /** Creates another user, for collaboration tests. */
  createUser: (label?: string) => Promise<SeededUser>;
  /** Creates a trip owned by the given user, or by `user`. */
  createTrip: (trip?: TripInput, owner?: SeededUser) => Promise<{ id: string; name: string }>;
  /** Puts a page into the given user's session, without going through the form. */
  signIn: (page: Page, user: SeededUser) => Promise<void>;
  /** The REST API as a particular user, for the things only they may do. */
  apiAs: (user: SeededUser) => SurmaiApi;
};

export const test = base.extend<Fixtures>({
  api: async ({ baseURL }, use) => {
    const context = await newApiContext(baseURL);
    const api = await SurmaiApi.asSuperuser(context, superuser.email, superuser.password);
    await use(api);
    await context.dispose();
  },

  user: async ({ api }, use, testInfo) => {
    const user = await api.createUser(emailFor(testInfo.workerIndex), defaultUser.password, 'Test User');
    await use(user);
  },

  createUser: async ({ api }, use, testInfo) => {
    await use((label = 'other') => api.createUser(emailFor(testInfo.workerIndex, label), defaultUser.password, label));
  },

  createTrip: async ({ api, user }, use) => {
    await use(async (trip = {}, owner = user) => {
      const created = await api.createTrip(owner, {
        name: `Trip ${unique()}`,
        startDate: isoDay(1),
        endDate: isoDay(8),
        ...trip,
      });
      return { id: created.id as string, name: created.name as string };
    });
  },

  apiAs: async ({ baseURL }, use) => {
    const context = await newApiContext(baseURL);
    await use((user) => SurmaiApi.asUser(context, user));
    await context.dispose();
  },

  signIn: async ({}, use) => {
    await use(async (page, user) => {
      const session = JSON.stringify({ token: user.token, record: user.record });
      await page.addInitScript(
        ([key, value]) => {
          window.localStorage.setItem(key, value);
        },
        [authStoreKey, session]
      );
    });
  },
});

export { expect };

/** A page already signed in as the given user, ready to navigate. */
export async function newApiContext(baseURL: string | undefined): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: baseURL || 'http://localhost:6173' });
}

function emailFor(workerIndex: number, label = 'user'): string {
  return `e2e-${label}-${workerIndex}-${unique()}@example.com`;
}
