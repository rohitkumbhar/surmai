import { expect, test } from './fixtures/test';

/**
 * Checks the test foundation itself: seeding through the API, a page adopting a
 * seeded user's session, and the mock services standing in for the real ones.
 */
test('a seeded trip is visible to its owner', async ({ page, user, createTrip, signIn }) => {
  const trip = await createTrip({ name: 'Foundation Trip' });

  await signIn(page, user);
  await page.goto(`/trips/${trip.id}`);

  await expect(page.locator('#app-header').getByText('Foundation Trip')).toBeVisible();
});

test('a trip is not visible to another user', async ({ page, createTrip, createUser, signIn }) => {
  const trip = await createTrip({ name: 'Private Trip' });
  const stranger = await createUser('stranger');

  await signIn(page, stranger);
  await page.goto(`/trips/${trip.id}`);

  await expect(page.locator('#app-header').getByText('Private Trip')).toBeHidden();
});

test('the seeded places are searchable', async ({ page, user, signIn }) => {
  await signIn(page, user);
  await page.goto('/trips/create');

  await page.getByLabel('Destinations').fill('Paris');

  await expect(page.getByRole('option').first()).toContainText('Paris');
});
