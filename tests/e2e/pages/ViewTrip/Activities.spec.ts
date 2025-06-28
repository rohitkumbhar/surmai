import { expect, test } from '@playwright/test';
import { ViewTripPage } from './ViewTripPage';
import { CreateNewTripPage, TripFormData } from '../CreateNewTrip/CreateNewTripPage';
import dayjs from 'dayjs';
import { getStartDate } from './helper.ts';

test.describe('Trip Activities', () => {
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
      name: `Activities Test Trip ${Date.now()}`,
      description: 'Test Description for Activities tests',
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
      destinations: ['Paris, France', 'Rome, Italy'],
      participants: ['Test User'],
    };

    await createNewTripPage.fillTripForm(tripData);
    await createNewTripPage.clickCreateTripButton();

    // Wait for navigation and extract the trip ID from the URL
    await page.waitForTimeout(1000);
    await page.waitForURL(/\/trips\/[^/]+$/);
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

  test('should add a museum visit activity', async ({ page }) => {
    const activityName = 'Visit the Louvre';
    const startDate = getStartDate(tripData.startDate);

    await viewTripPage.addActivity({
      name: activityName,
      startDate,

      address: 'Louvre Museum, Paris, France',
      description: 'See the Mona Lisa and other famous artworks',
    });

    // Verify the activity was added
    await expect(page.getByLabel('Organization').getByText(activityName)).toBeVisible();
  });

  test('should add a restaurant reservation activity', async ({ page }) => {
    const activityName = 'Dinner at Le Jules Verne';
    const startDate = getStartDate(tripData.startDate);

    await viewTripPage.addActivity({
      name: activityName,
      startDate,

      address: 'Eiffel Tower, Paris, France',
      description: 'Reservation at 8:00 PM',
    });

    // Verify the activity was added
    await expect(page.getByLabel('Organization').getByText(activityName)).toBeVisible();
  });

  test('should add a guided tour activity', async ({ page }) => {
    const activityName = 'Colosseum Guided Tour';
    const startDate = getStartDate(tripData.startDate);

    await viewTripPage.addActivity({
      name: activityName,
      startDate,
      address: 'Colosseum, Rome, Italy',
      description: 'Skip-the-line tickets included',
    });

    // Verify the activity was added
    await expect(page.getByLabel('Organization').getByText(activityName)).toBeVisible();
  });

  test('should add a free time activity', async ({ page }) => {
    const activityName = 'Shopping at Via del Corso';
    const startDate = getStartDate(tripData.startDate);

    await viewTripPage.addActivity({
      name: activityName,
      startDate,
      address: 'Via del Corso, Rome, Italy',
      description: 'Free time for shopping and exploring',
    });

    // Verify the activity was added
    await expect(page.getByLabel('Organization').getByText(activityName)).toBeVisible();
  });
});
