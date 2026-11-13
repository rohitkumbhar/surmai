import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';

import { isoDay } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';
import { ViewTripPage } from '@tests/e2e/pages/ViewTrip/ViewTripPage';

/**
 * A local time on a day relative to today, stored the way the app stores one:
 * the instant that matches that wall clock time here.
 */
const atHour = (dayOffset: number, hour: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString().replace('T', ' ');
};

// The day headings are formatted with 'LL', which needs the plugin the app
// loads in main.tsx. Playwright's process does not run vitest.setup.ts.
dayjs.extend(localizedFormat);

const heading = (dayOffset: number) => dayjs().add(dayOffset, 'day').format('LL');

test.describe('Trip itinerary', () => {
  test('groups the entries under the day they fall on, in time order', async ({
    page,
    user,
    createTrip,
    signIn,
    api,
  }) => {
    const trip = await createTrip({ startDate: isoDay(1), endDate: isoDay(5) });

    // Seeded out of order on purpose.
    await api.createRecord('activities', {
      trip: trip.id,
      name: 'Afternoon museum',
      address: 'Somewhere',
      startDate: atHour(1, 14),
      endDate: atHour(1, 16),
      metadata: { place: { id: 'pl-paris', name: 'Paris' } },
    });
    await api.createRecord('transportations', {
      trip: trip.id,
      type: 'train',
      origin: 'Morning train',
      destination: 'St Pancras',
      departureTime: atHour(1, 8),
      arrivalTime: atHour(1, 10),
      metadata: { provider: 'Eurostar' },
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).switchToTab('Itinerary');

    await expect(page.getByText(heading(1))).toBeVisible();

    const dayPanel = page.getByRole('region').filter({ hasText: 'Morning train' }).first();
    const text = (await dayPanel.textContent()) || '';
    expect(text.indexOf('Morning train')).toBeLessThan(text.indexOf('Afternoon museum'));
  });

  test('says when there is nothing in the window being shown', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip({ startDate: isoDay(1), endDate: isoDay(8) });
    // Only an entry well past the two days the itinerary opens on.
    await api.createRecord('activities', {
      trip: trip.id,
      name: 'Late activity',
      address: 'Somewhere',
      startDate: atHour(6, 10),
      endDate: atHour(6, 12),
      metadata: { place: { id: 'pl-paris', name: 'Paris' } },
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).switchToTab('Itinerary');

    await expect(page.getByText(/Nothing on the agenda between/)).toBeVisible();
    await expect(page.getByText('Late activity')).toBeHidden();
  });

  test('reaches a later entry by showing the next day', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip({ startDate: isoDay(1), endDate: isoDay(8) });
    await api.createRecord('activities', {
      trip: trip.id,
      name: 'Third day activity',
      address: 'Somewhere',
      startDate: atHour(3, 10),
      endDate: atHour(3, 12),
      metadata: { place: { id: 'pl-paris', name: 'Paris' } },
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).switchToTab('Itinerary');

    await expect(page.getByText('Third day activity')).toBeHidden();

    // The window opens on two days and grows a day at a time.
    await page.getByRole('button', { name: 'Show Next Day' }).click();
    await page.getByRole('button', { name: 'Show Next Day' }).click();

    await expect(page.getByText('Third day activity')).toBeVisible();
    await expect(page.getByText(heading(3))).toBeVisible();
  });

  test('shows a stay on both the day it starts and the day it ends', async ({
    page,
    user,
    createTrip,
    signIn,
    api,
  }) => {
    const trip = await createTrip({ startDate: isoDay(1), endDate: isoDay(8) });
    await api.createRecord('lodgings', {
      trip: trip.id,
      type: 'hotel',
      name: 'Hotel Bristol',
      address: '1 Rue de la Paix',
      startDate: atHour(1, 15),
      endDate: atHour(2, 11),
      metadata: { place: { id: 'pl-paris', name: 'Paris' } },
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).switchToTab('Itinerary');

    // Check-in on the first day and check-out on the second, both in the
    // window the itinerary opens on.
    await expect(page.getByText(heading(1))).toBeVisible();
    await expect(page.getByText(heading(2))).toBeVisible();
    await expect(page.getByText('Hotel Bristol')).toHaveCount(2);
  });
});
