import dayjs from 'dayjs';

import { storedDay } from '../../fixtures/api';
import { expect, test } from '../../fixtures/test';

import { getEndDate, getStartDate } from './helper.ts';
import { ViewTripPage } from './ViewTripPage';


test.describe('Trip Lodging', () => {
  let viewTripPage: ViewTripPage;
  let tripStart: string;

  // The trip is seeded through the API: these tests are about the panel, not
  // about creating a trip, and seeding keeps them independent of each other.
  test.beforeEach(async ({ page, user, createTrip, signIn }) => {
    tripStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const trip = await createTrip({
      name: 'Lodging Test Trip',
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

  test('should add a hotel lodging', async ({ page }) => {
    const hotelName = 'Test Hotel';

    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 5);

    await viewTripPage.addLodging({
      type: 'Hotel',
      name: hotelName,
      startDate,
      endDate,
      destination: 'New York',
      address: 'New York, NY',
      confirmationCode: '53BK3B4II3B4I',
    });

    // Verify the hotel was added
    await expect(page.getByText(hotelName, { exact: true })).toBeVisible();
  });

  test('should add an apartment lodging', async ({ page }) => {
    const apartmentName = 'Test Apartment';
    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 5);

    await viewTripPage.addLodging({
      type: 'Rental',
      name: apartmentName,
      startDate,
      endDate,
      destination: 'Los Angeles',
      address: 'Los Angeles, CA',
      confirmationCode: 'RENTAL-1234567890',
    });

    // Verify the apartment was added
    await expect(page.getByText(apartmentName, { exact: true })).toBeVisible();
  });

  test('should add a camp site lodging', async ({ page }) => {
    const hostelName = 'Test Campsite';
    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 3);

    await viewTripPage.addLodging({
      type: 'Camp Site',
      name: hostelName,
      startDate,
      endDate,
      destination: 'New York',
      address: 'San Francisco, CA',
      confirmationCode: 'CAMPSITE-1234567890',
    });

    // Verify the hostel was added
    await expect(page.getByText(hostelName, { exact: true })).toBeVisible();
  });
});
