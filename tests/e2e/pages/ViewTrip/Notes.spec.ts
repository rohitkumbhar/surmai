import { expect, test } from '@playwright/test';
import { ViewTripPage } from './ViewTripPage';
import { CreateNewTripPage, TripFormData } from '../CreateNewTrip/CreateNewTripPage';
import dayjs from 'dayjs';

test.describe('Trip Notes', () => {
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
      name: `Notes Test Trip ${Date.now()}`,
      description: 'Test Description for Notes tests',
      startDate: dayjs().startOf('month').toDate() as Date,
      endDate: dayjs().endOf('month').toDate() as Date,
      destinations: ['Barcelona, Spain'],
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

  test('should add a short note to the trip', async ({ page }) => {
    const noteText = 'This is a short test note for the trip.';

    // Add the note
    await viewTripPage.addNote(noteText);

    // Verify the note was added
    await expect(page.getByText(noteText)).toBeVisible();
  });

  test('should add a longer note with formatting to the trip', async ({ page }) => {
    const noteText =
      'This is a longer test note with multiple paragraphs.\n\nIt includes line breaks and should be displayed properly in the notes section.\n\nIt might also include some special characters: !@#$%^&*()';

    // Add the note
    await viewTripPage.addNote(noteText);

    // Verify the note was added (checking for a unique part of the text)
    await expect(page.getByText('multiple paragraphs')).toBeVisible();
    await expect(page.getByText('special characters')).toBeVisible();
  });

  test('should add a note with travel tips', async ({ page }) => {
    const noteText =
      'Travel Tips for Barcelona:\n- Bring comfortable walking shoes\n- Watch out for pickpockets in tourist areas\n- Try the local tapas\n- Visit La Sagrada Familia early in the morning to avoid crowds';

    // Add the note
    await viewTripPage.addNote(noteText);

    // Verify the note was added
    await expect(page.getByText('Travel Tips for Barcelona')).toBeVisible();
    await expect(page.getByText('Visit La Sagrada Familia')).toBeVisible();
  });
});
