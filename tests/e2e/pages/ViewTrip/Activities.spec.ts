import dayjs from 'dayjs';

import { getEndDate, getStartDate } from './helper.ts';
import { ViewTripPage } from './ViewTripPage';
import { storedDay } from '../../fixtures/api';
import { expect, test } from '../../fixtures/test';



test.describe('Trip Activities', () => {
  let viewTripPage: ViewTripPage;
  let tripStart: string;

  // The trip is seeded through the API: these tests are about the panel, not
  // about creating a trip, and seeding keeps them independent of each other.
  test.beforeEach(async ({ page, user, createTrip, signIn }) => {
    tripStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const trip = await createTrip({
      name: 'Activities Test Trip',
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

  test('should add a museum visit activity', async ({ page }) => {
    const activityName = 'Visit the Louvre';
    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 0.1);
    await viewTripPage.addActivity({
      name: activityName,
      startDate,
      endDate,
      destinationName: 'Paris',
      address: 'Louvre Museum, Paris, France',
      description: 'See the Mona Lisa and other famous artworks',
    });

    // Verify the activity was added
    await expect(page.getByLabel('Organization').getByText(activityName)).toBeVisible();
  });

  test('should add a restaurant reservation activity', async ({ page }) => {
    const activityName = 'Dinner at Le Jules Verne';
    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 0.1);

    await viewTripPage.addActivity({
      name: activityName,
      startDate,
      endDate,
      destinationName: 'Paris',
      address: 'Eiffel Tower, Paris, France',
      description: 'Reservation at 8:00 PM',
    });

    // Verify the activity was added
    await expect(page.getByLabel('Organization').getByText(activityName)).toBeVisible();
  });

  test('should add a guided tour activity', async ({ page }) => {
    const activityName = 'Colosseum Guided Tour';
    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 0.1);

    await viewTripPage.addActivity({
      name: activityName,
      startDate,
      endDate,
      destinationName: 'Rome',
      address: 'Colosseum, Rome, Italy',
      description: 'Skip-the-line tickets included',
    });

    // Verify the activity was added
    await expect(page.getByLabel('Organization').getByText(activityName)).toBeVisible();
  });

  test('should add a free time activity', async ({ page }) => {
    const activityName = 'Shopping at Via del Corso';
    const startDate = getStartDate(tripStart);
    const endDate = getEndDate(startDate, 0.1);
    await viewTripPage.addActivity({
      name: activityName,
      startDate,
      endDate,
      destinationName: 'Rome',
      address: 'Via del Corso, Rome, Italy',
      description: 'Free time for shopping and exploring',
    });

    // Verify the activity was added
    await expect(page.getByLabel('Organization').getByText(activityName)).toBeVisible();
  });
});
