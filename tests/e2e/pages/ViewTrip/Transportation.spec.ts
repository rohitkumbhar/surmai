import { expect, test } from '@playwright/test';
import { ViewTripPage } from './ViewTripPage';
import { CreateNewTripPage, TripFormData } from '../CreateNewTrip/CreateNewTripPage';
import * as path from 'path';
import * as fs from 'fs';
import dayjs from 'dayjs';
import { getEndDate, getStartDate } from './helper.ts';

const __dirname = import.meta.dirname;
test.describe('Trip Transportation', () => {
  let viewTripPage: ViewTripPage;
  let createNewTripPage: CreateNewTripPage;
  let tripId: string;
  let tripData: TripFormData;
  let tempFilePath: string;

  test.beforeAll(async ({ browser }) => {
    // Create a temporary file for attachment testing
    tempFilePath = path.join(__dirname, 'test-attachment.txt');
    fs.writeFileSync(tempFilePath, 'This is a test attachment for transportation');

    // Create a new context and page for trip creation
    const context = await browser.newContext({
      storageState: 'tests/playwright/.auth/user.json',
    });

    // Initialize the CreateNewTripPage
    const page = await context.newPage();
    createNewTripPage = new CreateNewTripPage(page);

    // Navigate to the create new trip page
    await createNewTripPage.goto();

    // Create a new trip
    tripData = {
      name: `Transportation Test Trip ${Date.now()}`,
      description: 'Test Description for Transportation tests',
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

  test.afterAll(async () => {
    // Clean up the temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // we need to delete the trip as well
  });

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(msg.text()));

    // Initialize the ViewTripPage
    viewTripPage = new ViewTripPage(page);

    // Navigate to the trip page
    await viewTripPage.goto(tripId);
  });

  test('should add a flight transportation', async ({ page }) => {
    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 0.5);

    await viewTripPage.addTransportation({
      type: 'Flight',
      startDate,
      endDate,
      startLocation: 'JFK',
      endLocation: 'SEA',
      confirmationCode: 'FLIGHT1234567890',
      provider: 'Delta Airlines',
    });

    // Verify the flight was added
    await expect(page.getByText('FLIGHT1234567890')).toBeVisible();
  });

  test('should add a train transportation', async ({ page }) => {
    const trainName = 'Test Train';
    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 0.5);

    await viewTripPage.addTransportation({
      type: 'Train',
      startDate,
      endDate,
      startLocation: 'New York, NY',
      endLocation: 'Washington, DC',
      confirmationCode: trainName,
      provider: 'Amtrak',
    });

    // Verify the train was added
    await expect(page.getByText(trainName)).toBeVisible();
  });

  test('should add a car rental transportation', async ({ page }) => {
    const carName = 'Test Car Rental';
    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 5);
    await viewTripPage.addCarRental({
      pickupTime: startDate,
      dropOffTime: endDate,
      pickupLocation: 'Los Angeles Airport',
      dropOffLocation: 'Los Angeles Airport',
      confirmationCode: carName,
      rentalCompany: 'Enterprise',
      cost: 200,
      currencyCode: 'USD',
    });

    // Verify the car rental was added
    await expect(page.getByText(carName)).toBeVisible();
  });

  test('should add an attachment to transportation and view it in Attachments tab', async ({ page }) => {
    const trainName = 'Attachment Test Train';
    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 0.5);

    await viewTripPage.addTransportation({
      type: 'Train',
      startDate,
      endDate,
      startLocation: 'New York, NY',
      endLocation: 'Washington, DC',
      confirmationCode: trainName,
      provider: 'Amtrak',
      attachment: tempFilePath,
    });

    // Verify the train was added
    await expect(page.getByText(trainName)).toBeVisible();

    // Verify the attachment is visible in the transportation section
    await expect(page.getByRole('link', { name: 'test-attachment.txt' })).toBeVisible();

    // Check that the attachment is also visible in the Attachments tab
    await viewTripPage.checkAttachmentVisible('test-attachment.txt');
  });
});
