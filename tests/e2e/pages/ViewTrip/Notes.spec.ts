import dayjs from 'dayjs';

import { storedDay } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';
import { ViewTripPage } from '@tests/e2e/pages/ViewTrip/ViewTripPage';



test.describe('Trip Notes', () => {
  let viewTripPage: ViewTripPage;
  let tripStart: string;

  // The trip is seeded through the API: these tests are about the panel, not
  // about creating a trip, and seeding keeps them independent of each other.
  test.beforeEach(async ({ page, user, createTrip, signIn }) => {
    tripStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const trip = await createTrip({
      name: 'Notes Test Trip',
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
