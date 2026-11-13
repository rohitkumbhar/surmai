import { isoDay, unique } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';

test.describe('My Trips', () => {
  test('lists a trip and opens it', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip({ name: `Lisbon ${unique()}` });
    await signIn(page, user);

    await page.goto('/');

    const card = page.getByText(trip.name);
    await expect(card).toBeVisible();

    await card.click();
    await expect(page).toHaveURL(new RegExp(`/trips/${trip.id}`));
    await expect(page.locator('#app-header').getByText(trip.name)).toBeVisible();
  });

  test('separates upcoming trips from trips in the past', async ({ page, user, createTrip, signIn }) => {
    const upcoming = await createTrip({
      name: `Upcoming ${unique()}`,
      startDate: isoDay(20),
      endDate: isoDay(27),
    });
    const past = await createTrip({
      name: `Past ${unique()}`,
      startDate: isoDay(-40),
      endDate: isoDay(-33),
    });

    await signIn(page, user);
    await page.goto('/');

    // The page renders one grid per section, upcoming first.
    const grids = page.locator('.mantine-SimpleGrid-root');
    await expect(grids.nth(0).getByText(upcoming.name)).toBeVisible();
    await expect(grids.nth(1).getByText(past.name)).toBeVisible();

    await expect(grids.nth(0).getByText(past.name)).toBeHidden();
    await expect(grids.nth(1).getByText(upcoming.name)).toBeHidden();
  });

  test('does not list a trip belonging to somebody else', async ({
    page,
    user,
    createUser,
    createTrip,
    signIn,
  }) => {
    const stranger = await createUser('stranger');
    const theirs = await createTrip({ name: `Private ${unique()}` }, stranger);
    const mine = await createTrip({ name: `Mine ${unique()}` });

    await signIn(page, user);
    await page.goto('/');

    await expect(page.getByText(mine.name)).toBeVisible();
    await expect(page.getByText(theirs.name)).toBeHidden();
  });

  test('offers to start a trip when there are none', async ({ page, user, signIn }) => {
    await signIn(page, user);
    await page.goto('/');

    await expect(page.getByText('No upcoming trips.')).toBeVisible();
    await expect(page.getByText('No trips in the past year.')).toBeVisible();

    await page.getByRole('button', { name: 'New Trip' }).first().click();
    await expect(page).toHaveURL(/\/trips\/create/);
  });
});
