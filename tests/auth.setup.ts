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

  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Datasets' }).click();

  const loadAirportsLocator = page.getByRole('button', { name: 'Load Airports' });
  const airportsLocatorCount = await loadAirportsLocator.count();
  if (airportsLocatorCount > 0) {
    await loadAirportsLocator.click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(5000);
  }

  const loadPlacesLocator = page.getByRole('button', { name: 'Load Places' });
  const placesLocatorCount = await loadPlacesLocator.count();
  if (placesLocatorCount > 0) {
    await loadPlacesLocator.click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(50000);
  }

  const loadAirlinesLocator = page.getByRole('button', { name: 'Load Airlines' });
  const loadAirlinesLocatorCount = await loadAirlinesLocator.count();
  if (loadAirlinesLocatorCount > 0) {
    await loadAirlinesLocator.click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(5000);
  }
});
