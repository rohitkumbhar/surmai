import { expect, test } from '@playwright/test';
import { CreateNewTripPage } from './CreateNewTripPage';

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

  // test('should show validation error for empty required fields', async ({ page }) => {
  //   // Try to submit the form without filling required fields
  //   await createNewTripPage.clickCreateTripButton();
  //
  //   // Check that the Create Trip button is disabled due to validation
  //   await expect(page.getByRole('button', { name: 'Create Trip' })).toBeDisabled();
  // });

  test('should create a trip successfully', async ({ page }) => {
    // Mock the API to return a successful response
    // await page.route('*/**/api/collections/trips/records', async (route) => {
    //   await route.fulfill({
    //     status: 200,
    //     contentType: 'application/json',
    //     body: JSON.stringify({
    //       id: 'test-trip-id',
    //       name: 'Test Trip',
    //       description: 'Test Description',
    //       startDate: new Date().toISOString(),
    //       endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    //       ownerId: 'test-user-id',
    //     }),
    //   });
    // });

    // Fill in the form with valid data
    await createNewTripPage.fillTripForm({
      name: 'Test Trip',
      description: 'Test Description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      destinations: ['New York, NY, USA'],
      participants: ['John Doe', 'Jane Smith'],
    });

    // Submit the form
    await createNewTripPage.clickCreateTripButton();

    // Check that error notification is shown
    await expect(page.getByText('Error')).toBeVisible();
    await expect(page.getByText('Unable to create trip')).toBeVisible();
  });

  // test('should handle destination selection', async ({ page }) => {
  //   // Mock the destination search API
  //   // await page.route('**/api/**', async (route) => {
  //   //   console.log('route.request().url() =>', route.request().url());
  //   //   if (route.request().url().includes('places')) {
  //   //     await route.fulfill({
  //   //       status: 200,
  //   //       contentType: 'application/json',
  //   //       body: JSON.stringify({
  //   //         page: 1,
  //   //         perPage: 10,
  //   //         totalItems: 1,
  //   //         totalPages: 1,
  //   //         items: [
  //   //           {
  //   //             id: 'dest1',
  //   //             name: 'New York',
  //   //             stateName: 'NY',
  //   //             countryName: 'USA',
  //   //             latitude: 40.7128,
  //   //             longitude: -74.006,
  //   //             timezone: 'America/New_York',
  //   //           },
  //   //         ],
  //   //       }),
  //   //     });
  //   //   } else {
  //   //     await route.continue();
  //   //   }
  //   // });
  //
  //   // Test destination selection
  //   await createNewTripPage.searchAndSelectDestination('Seattle');
  //   // await page.waitForResponse(/.*api.*/);
  //
  //   // Verify the destination was added
  //   await expect(page.getByText('Seattle, Washington, USA')).toBeVisible();
  // });
});
