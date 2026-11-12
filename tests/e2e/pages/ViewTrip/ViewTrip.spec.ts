import dayjs from 'dayjs';

import { ViewTripPage } from './ViewTripPage';
import { storedDay } from '../../fixtures/api';
import { expect, test } from '../../fixtures/test';


test.describe('View Trip Page', () => {
  const startDate = dayjs().startOf('month');
  const endDate = dayjs().endOf('month');

  test('should display the trip details', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip({
      name: 'View Trip Test',
      description: 'A seeded trip to view',
      startDate: storedDay(startDate.format('YYYY-MM-DD')),
      endDate: storedDay(endDate.format('YYYY-MM-DD')),
      destinations: [
        {
          id: 'nyc',
          name: 'New York',
          stateName: 'New York',
          countryName: 'United States',
          latitude: '40.71427',
          longitude: '-74.00597',
          timezone: 'America/New_York',
        },
      ],
    });

    await signIn(page, user);
    const viewTripPage = new ViewTripPage(page);
    await viewTripPage.goto(trip.id);

    await viewTripPage.expectTripDetailsVisible('View Trip Test');

    await expect(
      page
        .locator('#app-header')
        .getByText(`${startDate.format('MMM D, YYYY')} - ${endDate.format('MMM D, YYYY')}`, { exact: false })
    ).toBeVisible();

    // Organization is the tab the page opens on
    await expect(page.getByRole('tab', { name: 'Organization', selected: true })).toBeVisible();

    await viewTripPage.openAccordionSection('Basic Information');
    await expect(page.getByText('A seeded trip to view')).toBeVisible();
    await expect(page.getByText('New York', { exact: false }).first()).toBeVisible();
  });

  test('should show the tabs for a trip', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip({ name: 'Tabs Test' });

    await signIn(page, user);
    await new ViewTripPage(page).goto(trip.id);

    for (const tab of ['Organization', 'Itinerary', 'Attachments', 'Expenses', 'Notes']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }
  });
});
