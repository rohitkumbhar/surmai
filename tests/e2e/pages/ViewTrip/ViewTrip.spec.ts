import { expect, test } from '@playwright/test';
import { ViewTripPage } from './ViewTripPage';
import { CreateNewTripPage, TripFormData } from '../CreateNewTrip/CreateNewTripPage';
import dayjs from 'dayjs';

test.describe('View Trip Page', () => {
  let viewTripPage: ViewTripPage;
  let createNewTripPage: CreateNewTripPage;
  let tripId: string;
  let tripData: TripFormData;

  test.beforeAll(async ({ browser }) => {
    // Create a new context and page for trip creation
    const context = await browser.newContext({
      storageState: 'tests/playwright/.auth/user.json',
    });
    const page = await context.newPage();

    // Initialize the CreateNewTripPage
    createNewTripPage = new CreateNewTripPage(page);

    // Navigate to the create new trip page
    await createNewTripPage.goto();

    // Create a new trip
    tripData = {
      name: `Test Trip ${Date.now()}`,
      description: 'Test Description for ViewTrip tests',
      startDate: dayjs().startOf('month').toDate() as Date,
      endDate: dayjs().endOf('month').toDate() as Date,
      destinations: ['New York, NY, USA'],
      participants: ['Test User'],
    };

    await createNewTripPage.fillTripForm(tripData);
    await createNewTripPage.clickCreateTripButton();

    // Wait for navigation and extract the trip ID from the URL
    await page.waitForTimeout(1000);
    const url = page.url();
    tripId = url.split('/').pop() || '';

    // Close the context
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Initialize the ViewTripPage
    viewTripPage = new ViewTripPage(page);

    // Navigate to the trip page
    await viewTripPage.goto(tripId);
  });

  test('should display the trip details', async ({ page }) => {
    // Check that the trip name is visible in the header
    await viewTripPage.expectTripDetailsVisible(tripData.name);

    // Check that the trip dates are visible
    const startDateStr = dayjs(tripData.startDate).format('MMMM DD, YYYY');
    const endDateStr = dayjs(tripData.endDate).format('MMMM DD, YYYY');
    await expect(
      page.locator('#app-header').getByText(`${startDateStr} - ${endDateStr}`, { exact: false })
    ).toBeVisible();

    // Check that the Organization tab is selected by default
    await expect(page.getByRole('tab', { name: 'Organization', selected: true })).toBeVisible();

    // Check that the Basic Information accordion is visible
    await viewTripPage.openAccordionSection('Basic Information');
    await expect(page.getByText(tripData.description)).toBeVisible();

    // Check that the destination is visible
    await expect(page.getByText(tripData.destinations[0], { exact: false })).toBeVisible();
  });
});
