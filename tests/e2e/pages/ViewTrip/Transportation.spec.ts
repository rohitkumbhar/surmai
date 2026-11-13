import dayjs from 'dayjs';

import { storedDay } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';
import { getEndDate, getStartDate } from '@tests/e2e/pages/ViewTrip/helper.ts';
import { ViewTripPage } from '@tests/e2e/pages/ViewTrip/ViewTripPage';


test.describe('Trip Transportation', () => {
  let viewTripPage: ViewTripPage;
  let tripStart: string;
  // The attachment field only accepts images and PDFs, so this is a minimal
  // valid PDF. It is passed in memory rather than written to disk, which the
  // browser projects would otherwise share.
  const attachment = {
    name: 'test-attachment.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
        '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
        '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj\n' +
        'trailer<</Root 1 0 R>>\n%%EOF\n'
    ),
  };

  // The trip is seeded through the API: these tests are about the panel, not
  // about creating a trip, and seeding keeps them independent of each other.
  test.beforeEach(async ({ page, user, createTrip, signIn }) => {
    tripStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const trip = await createTrip({
      name: 'Transportation Test Trip',
      description: 'Seeded for the panel tests',
      startDate: storedDay(tripStart),
      endDate: storedDay(dayjs().endOf('month').format('YYYY-MM-DD')),
      destinations: [
        { id: 'nyc', name: 'New York', stateName: 'New York', countryName: 'United States', latitude: '40.71427', longitude: '-74.00597', timezone: 'America/New_York' },
        { id: 'la', name: 'Los Angeles', stateName: 'California', countryName: 'United States', latitude: '34.05223', longitude: '-118.24368', timezone: 'America/Los_Angeles' },
      ],
    });

    await signIn(page, user);
    viewTripPage = new ViewTripPage(page);
    await viewTripPage.goto(trip.id);
  });

  test('should add a flight transportation', async ({ page }) => {
    const startDate = getStartDate(tripStart);
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

  test('#125 should add a flight transportation with free form airport', async ({ page }) => {
    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 0.5);

    await viewTripPage.addTransportation({
      type: 'Flight',
      startDate,
      endDate,
      startLocation: 'QQQ',
      endLocation: 'WWW',
      confirmationCode: 'UNKNOWN_AIRPORT',
      provider: 'Delta Air Lines',
    });

    // Verify the flight was added
    await expect(page.getByText('UNKNOWN_AIRPORT')).toBeVisible();
  });

  test('should add a train transportation', async ({ page }) => {
    const trainName = 'Test Train';
    const startDate = getStartDate(tripStart);
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
    const startDate = getStartDate(tripStart);
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
    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 0.5);

    await viewTripPage.addTransportation({
      type: 'Train',
      startDate,
      endDate,
      startLocation: 'New York, NY',
      endLocation: 'Washington, DC',
      confirmationCode: trainName,
      provider: 'Amtrak',
      attachment,
    });

    // Verify the train was added
    await expect(page.getByText(trainName)).toBeVisible();

    // Verify the attachment is visible in the transportation section
    await expect(page.getByRole('link', { name: 'test-attachment.pdf' })).toBeVisible();

    // Check that the attachment is also visible in the Attachments tab
    await viewTripPage.checkAttachmentVisible('test-attachment.pdf');
  });
});
