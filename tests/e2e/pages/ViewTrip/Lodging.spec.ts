import { expect, test } from '@playwright/test';
import { ViewTripPage } from './ViewTripPage';
import { CreateNewTripPage, TripFormData } from '../CreateNewTrip/CreateNewTripPage';
import dayjs from 'dayjs';
import { getEndDate, getStartDate } from './helper.ts';

test.describe('Trip Lodging', () => {
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
      name: `Lodging Test Trip ${Date.now()}`,
      description: 'Test Description for Lodging tests',
      startDate: dayjs().startOf('month').toDate() as Date,
      endDate: dayjs().endOf('month').toDate() as Date,
      destinations: ['New York, NY, USA', 'Los Angeles, CA, USA'],
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

  test('should add a hotel lodging', async ({ page }) => {
    const hotelName = 'Test Hotel';

    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 5);

    await viewTripPage.addLodging({
      type: 'Hotel',
      name: hotelName,
      startDate,
      endDate,
      address: 'New York, NY',
      confirmationCode: '53BK3B4II3B4I',
    });

    // Verify the hotel was added
    await expect(page.getByText(hotelName, { exact: true })).toBeVisible();
  });

  test('should add an apartment lodging', async ({ page }) => {
    const apartmentName = 'Test Apartment';
    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 5);

    await viewTripPage.addLodging({
      type: 'Rental',
      name: apartmentName,
      startDate,
      endDate,
      address: 'Los Angeles, CA',
      confirmationCode: 'RENTAL-1234567890',
    });

    // Verify the apartment was added
    await expect(page.getByText(apartmentName, { exact: true })).toBeVisible();
  });

  test('should add a camp site lodging', async ({ page }) => {
    const hostelName = 'Test Campsite';
    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 3);

    await viewTripPage.addLodging({
      type: 'Camp Site',
      name: hostelName,
      startDate,
      endDate,
      address: 'San Francisco, CA',
      confirmationCode: 'CAMPSITE-1234567890',
    });

    // Verify the hostel was added
    await expect(page.getByText(hostelName, { exact: true })).toBeVisible();
  });
});
