import { expect, test } from '@playwright/test';
import { CreateNewTripPage } from './CreateNewTripPage';
import dayjs from 'dayjs';

test.describe('Create New Trip Page', () => {
  let createNewTripPage: CreateNewTripPage;

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(msg.text()));

    // Initialize the Page Object
    createNewTripPage = new CreateNewTripPage(page);

    // Navigate to the create new trip page before each test
    await createNewTripPage.goto();
  });

  test('should display the create new trip form', async ({ page }) => {
    // Check that the page header is correct
    await expect(page.locator('#app-header').getByText('Start A New Trip')).toBeVisible();

    // Check that the form elements are visible
    await createNewTripPage.expectFormElementsVisible();
  });

  test('should create a trip successfully', async ({ page }) => {
    // Fill in the form with valid data
    await createNewTripPage.fillTripForm({
      name: 'Test Trip',
      description: 'Test Description',
      startDate: dayjs().startOf('month').toDate() as Date,
      endDate: dayjs().endOf('month').toDate() as Date,
      destinations: ['New York, NY, USA'],
      participants: ['John Doe', 'Jane Smith'],
    });

    // Submit the form
    await createNewTripPage.clickCreateTripButton();
    await page.waitForResponse(/api\/collections\/trips\/records/);

    // Check that we've navigated to the trip detail page
    // await expect(page.url()).toContain('/trips/test-trip-id');
    await expect(page.locator('#app-header').getByText('Test Trip')).toBeVisible();
  });

  test('should show error notification when trip creation fails', async ({ page }) => {
    // Mock the API to return an error
    await page.route('**/api/collections/trips/records', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Failed to create trip',
        }),
      });
    });

    // Fill in the form with valid data
    await createNewTripPage.fillTripForm({
      name: 'Test Trip',
      description: 'Test Description',
      startDate: dayjs().startOf('month').toDate() as Date,
      endDate: dayjs().endOf('month').toDate() as Date,
      destinations: ['New York, NY, USA'],
      participants: ['John Doe', 'Jane Smith'],
    });

    // Submit the form
    await createNewTripPage.clickCreateTripButton();

    // Check that error notification is shown
    await expect(page.getByText('Error')).toBeVisible();
    await expect(page.getByText('Unable to create trip')).toBeVisible();
  });
});
