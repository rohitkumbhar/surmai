import { test as setup } from '@playwright/test';

import * as path from 'path';

// @ts-expect-error its ok
const __dirname = import.meta.dirname;
const storageState = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = 'admin@test.surmai.app';
  const password = 'uf3u2uo3f3uuo23#$#WAIT';

  // Navigate to the login page
  await page.goto(`/login`);

  // Fill in the login form
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill(password);

  // Submit the form
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for navigation to complete and ensure we're logged in
  await page.waitForURL(`/`);

  // Save the authentication state to the specified file
  if (storageState) {
    await page.context().storageState({ path: storageState as string });
  }
});
