import dayjs from 'dayjs';

import { expect, test } from '@tests/e2e/fixtures/test';

/** A local time on a given day of this year, stored the way the app stores one. */
const thisYearAt = (month: number, day: number, hour = 9): string => {
  const date = new Date();
  date.setMonth(month - 1, day);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString().replace('T', ' ');
};

const currentYear = dayjs().year();

test.describe('Travel Board', () => {
  test('counts nothing for a year with no trips', async ({ page, user, signIn }) => {
    await signIn(page, user);
    await page.goto('/travel-board');

    await expect(page.locator('#app-header').getByText('Travel Board')).toBeVisible();
    await expect(page.getByText('No data').first()).toBeVisible();
  });

  test('counts the trips, destinations and days of the selected year', async ({
    page,
    user,
    createTrip,
    signIn,
  }) => {
    // Two trips inside this year: 5 days and 3 days.
    await createTrip({
      name: 'Spring break',
      startDate: thisYearAt(3, 1, 0),
      endDate: thisYearAt(3, 5, 0),
      destinations: [{ id: 'pl-1', name: 'Paris' }],
    });
    await createTrip({
      name: 'Autumn city break',
      startDate: thisYearAt(10, 10, 0),
      endDate: thisYearAt(10, 12, 0),
      destinations: [{ id: 'pl-2', name: 'Tokyo' }],
    });

    await signIn(page, user);
    await page.goto(`/travel-board?year=${currentYear}`);

    const trips = page.getByText('Trips', { exact: true }).locator('..');
    await expect(trips.getByText('2')).toBeVisible();

    const destinations = page.getByText('Destinations', { exact: true }).locator('..');
    await expect(destinations.getByText('2')).toBeVisible();
  });

  test('counts the stays and the nights', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip({
      name: 'With a stay',
      startDate: thisYearAt(6, 1, 0),
      endDate: thisYearAt(6, 10, 0),
    });
    await api.createRecord('lodgings', {
      trip: trip.id,
      type: 'hotel',
      name: 'Hotel Bristol',
      address: '1 Rue de la Paix',
      startDate: thisYearAt(6, 2, 15),
      endDate: thisYearAt(6, 5, 11),
      metadata: { place: { id: 'pl-paris', name: 'Paris' } },
    });

    await signIn(page, user);
    await page.goto(`/travel-board?year=${currentYear}`);

    await expect(page.getByText('Lodging Stats')).toBeVisible();
    // Three nights: the 2nd, the 3rd and the 4th.
    await expect(page.getByText('Total Nights').locator('..')).toContainText('3');
  });

  test('leaves out a trip from another year', async ({ page, user, createTrip, signIn }) => {
    await createTrip({
      name: 'This year',
      startDate: thisYearAt(5, 1, 0),
      endDate: thisYearAt(5, 3, 0),
    });

    await signIn(page, user);
    await page.goto(`/travel-board?year=${currentYear - 1}`);

    await expect(page.getByText('No data').first()).toBeVisible();
  });
});
