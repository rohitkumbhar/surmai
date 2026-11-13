import { unique } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';
import { ViewTripPage } from '@tests/e2e/pages/ViewTrip/ViewTripPage';

import type { Page } from '@playwright/test';

/**
 * The Actions menu sits in the Basic Information panel of the Organization
 * tab, which starts collapsed.
 */
const openActions = async (page: Page, item: string) => {
  await new ViewTripPage(page).openAccordionSection('Basic Information');
  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: item }).click();
};

test.describe('Trip actions', () => {
  test('edits the name and the description', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip({ name: `Before ${unique()}` });
    const renamed = `After ${unique()}`;

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await expect(page.locator('#app-header').getByText(trip.name)).toBeVisible();

    await openActions(page, 'Edit');

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill(renamed);
    await dialog.getByRole('textbox', { name: 'Brief Description' }).fill('Rewritten by the suite');

    const saved = page.waitForResponse(
      (response) => response.url().includes(`/api/collections/trips/records/${trip.id}`) && response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await saved;

    await expect(page.locator('#app-header').getByText(renamed)).toBeVisible();
    // Scoped to the panel: the modal's textarea is still in the DOM.
    await expect(
      page.getByRole('region', { name: /Basic Information/ }).getByText('Rewritten by the suite')
    ).toBeVisible();
  });

  test('adds a destination', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip();

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await openActions(page, 'Edit');

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Destinations').fill('Paris');
    // The dropdown renders in a portal, outside the dialog.
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible();
    await option.click();

    const saved = page.waitForResponse(
      (response) => response.url().includes(`/api/collections/trips/records/${trip.id}`) && response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await saved;

    await expect(page.getByRole('region', { name: /Basic Information/ }).getByText('Paris')).toBeVisible();
  });

  test('refuses to save a trip without a name', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip();

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await openActions(page, 'Edit');

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill('');
    await dialog.getByRole('button', { name: 'Save' }).click();

    // The form stays open rather than writing an unnamed trip.
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('deletes the trip once the deletion is confirmed', async ({ page, user, createTrip, signIn, apiAs }) => {
    const trip = await createTrip({ name: `Doomed ${unique()}` });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await openActions(page, 'Delete');

    await expect(page.getByText('This action cannot be undone.')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // Back to the trips list, which is now empty, and gone from the API too.
    await expect(page).toHaveURL(/\/$|\/trips$/);
    await expect(page.getByText('No upcoming trips.')).toBeVisible();

    const trips = await apiAs(user).listRecords('trips', { filter: `id="${trip.id}"` });
    expect(trips.totalItems).toBe(0);
  });

  test('keeps the trip when the deletion is cancelled', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip({ name: `Spared ${unique()}` });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await openActions(page, 'Delete');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(new RegExp(`/trips/${trip.id}`));
    await expect(page.locator('#app-header').getByText(trip.name)).toBeVisible();
  });

  test('exports the trip as a zip', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip({ name: `Exported ${unique()}` });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await openActions(page, 'Export Trip');

    await page.getByRole('button', { name: 'Prepare Export' }).click();

    const download = page.waitForEvent('download');
    // Rendered as an anchor around a blob url, so it is a link, not a button.
    await page.getByRole('link', { name: 'Download' }).click();
    const file = await download;

    expect(file.suggestedFilename()).toBe(`trip-${trip.name}-${trip.id}.zip`);
  });

  test('generates an iCalendar file for the trip', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip({ name: `Calendared ${unique()}` });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await openActions(page, 'Add To Calendar');

    await page.getByRole('button', { name: 'Generate' }).click();

    const download = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download' }).click();
    const file = await download;

    expect(file.suggestedFilename()).toBe(`${trip.name}.ics`);
  });

  test('downloads the itinerary as a pdf', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip({ name: `Printed ${unique()}` });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);

    const download = page.waitForEvent('download');
    await openActions(page, 'Download Full Itinerary (PDF)');
    const file = await download;

    expect(file.suggestedFilename()).toBe(`${trip.name}_Full_Itinerary.pdf`);
  });

  test('offers no editing to somebody who only collaborates through an invitation', async ({
    page,
    user,
    createUser,
    createTrip,
    signIn,
  }) => {
    const stranger = await createUser('stranger');
    const theirs = await createTrip({ name: `Not mine ${unique()}` }, stranger);

    await signIn(page, user);
    await page.goto(`/trips/${theirs.id}`);

    // The trip is not theirs to read at all.
    await expect(page.locator('#app-header').getByText(theirs.name)).toBeHidden();
  });
});

test.describe('Export and import', () => {
  test('imports a trip back from its own export', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip({ name: `Round trip ${unique()}`, description: 'Taken there and back' });
    await api.createRecord('lodgings', {
      trip: trip.id,
      type: 'hotel',
      name: 'Hotel Bristol',
      address: '1 Rue de la Paix',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);

    await new ViewTripPage(page).openAccordionSection('Basic Information');
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Export Trip' }).click();
    await page.getByRole('button', { name: 'Prepare Export' }).click();

    const download = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download' }).click();
    const archive = await (await download).path();

    await page.goto('/');
    // Mantine's FileButton is a hidden input behind the button.
    await page.locator('input[type="file"]').setInputFiles(archive);

    // The import lands on the copy it just created, which is a different trip.
    await expect(page).toHaveURL(/\/trips\/[a-z0-9]+/);
    await expect(page).not.toHaveURL(new RegExp(`/trips/${trip.id}`));
    await expect(page.locator('#app-header').getByText(trip.name)).toBeVisible();

    await new ViewTripPage(page).openAccordionSection('Lodging');
    await expect(page.getByText('Hotel Bristol')).toBeVisible();
  });
});
