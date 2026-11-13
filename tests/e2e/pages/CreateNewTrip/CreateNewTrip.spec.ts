import dayjs from 'dayjs';

import { unique } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';
import { CreateNewTripPage } from '@tests/e2e/pages/CreateNewTrip/CreateNewTripPage';


test.describe('Create New Trip Page', () => {
  let createNewTripPage: CreateNewTripPage;

  const tripForm = {
    name: 'Test Trip',
    description: 'Test Description',
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    destinations: ['New York'],
  };

  test.beforeEach(async ({ page, user, signIn }) => {
    await signIn(page, user);
    createNewTripPage = new CreateNewTripPage(page);
    await createNewTripPage.goto();
  });

  test('should display the create new trip form', async ({ page }) => {
    await expect(page.locator('#app-header').getByText('Start A New Trip')).toBeVisible();
    await createNewTripPage.expectFormElementsVisible();
  });

  test('should create a trip successfully', async ({ page }) => {
    await createNewTripPage.fillTripForm(tripForm);

    const tripId = await createNewTripPage.clickCreateTripButton();

    expect(tripId).not.toBe('');
    await expect(page.locator('#app-header').getByText('Test Trip')).toBeVisible();
  });

  // The field offers the traveller profiles the user owns, so the profile is
  // seeded first and then picked by name.
  test('should attach a traveller profile to the trip', async ({ page, api, user }) => {
    // profile emails are unique across the instance, so this one has to be too
    const legalName = `Ada Lovelace ${unique()}`;
    await api.createTravellerProfile(user, { legalName, email: `ada-${unique()}@example.com` });
    await page.reload();

    await createNewTripPage.fillTripForm({ ...tripForm, travellers: [legalName] });
    await createNewTripPage.clickCreateTripButton();

    await expect(page.locator('#app-header').getByText('Test Trip')).toBeVisible();
  });

  test('should show error notification when trip creation fails', async ({ page }) => {
    await page.route('**/api/collections/trips/records', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Failed to create trip' }),
      });
    });

    await createNewTripPage.fillTripForm(tripForm);
    await page.getByRole('button', { name: 'Create Trip' }).click();

    await expect(page.getByText('Unable to create trip')).toBeVisible();
  });
});
