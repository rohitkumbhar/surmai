import { isoDay, unique } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';
import { ViewTripPage } from '@tests/e2e/pages/ViewTrip/ViewTripPage';

import type { Page } from '@playwright/test';

/**
 * Opens the Edit or Delete item on an entry's own menu. The trigger is an
 * icon button whose only accessible name is on the svg inside it.
 */
const entryMenu = async (page: Page, item: 'Edit' | 'Delete') => {
  await page.getByRole('img', { name: 'Menu' }).first().click();
  await page.getByRole('menuitem', { name: item }).click();
};

const confirmDeletion = async (page: Page) => {
  const confirmation = page.getByRole('dialog').filter({ hasText: 'This action cannot be undone' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Delete' }).click();
};

test.describe('Editing and deleting entries', () => {
  test('renames a lodging and keeps the rest of it', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip();
    await api.createRecord('lodgings', {
      trip: trip.id,
      type: 'hotel',
      name: 'Hotel Bristol',
      address: '1 Rue de la Paix',
      confirmationCode: 'BR-77',
      startDate: isoDay(1),
      endDate: isoDay(3),
      // Destination is required by the form, so seed one as the app stores it.
      metadata: { place: { id: 'pl-paris', name: 'Paris' } },
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).openAccordionSection('Lodging');
    await expect(page.getByText('Hotel Bristol')).toBeVisible();

    await entryMenu(page, 'Edit');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill('Hotel Lutetia');

    const saved = page.waitForResponse(
      (response) => response.url().includes('/save-lodging') && response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await saved;

    await expect(page.getByText('Hotel Lutetia')).toBeVisible();
    await expect(page.getByText('Hotel Bristol')).toBeHidden();
    await expect(page.getByText('BR-77')).toBeVisible();
  });

  test('deletes a lodging once the deletion is confirmed', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip();
    const name = `Doomed hotel ${unique()}`;
    await api.createRecord('lodgings', {
      trip: trip.id,
      type: 'hotel',
      name,
      address: 'Somewhere',
      startDate: isoDay(1),
      endDate: isoDay(3),
      metadata: { place: { id: 'pl-paris', name: 'Paris' } },
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).openAccordionSection('Lodging');
    await expect(page.getByText(name)).toBeVisible();

    await entryMenu(page, 'Delete');
    await confirmDeletion(page);

    await expect(page.getByRole('region', { name: /Lodging/ }).getByText(name)).toBeHidden();

    const remaining = await api.listRecords('lodgings', { filter: `trip="${trip.id}"` });
    expect(remaining.totalItems).toBe(0);
  });

  test('edits an activity', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip();
    await api.createRecord('activities', {
      trip: trip.id,
      name: 'Museum visit',
      address: '1 Rue de la Legion',
      startDate: isoDay(1),
      endDate: isoDay(1),
      metadata: { place: { id: 'pl-paris', name: 'Paris' } },
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).openAccordionSection('Activities');
    await expect(page.getByText('Museum visit')).toBeVisible();

    await entryMenu(page, 'Edit');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill('Gallery visit');

    const saved = page.waitForResponse((response) => response.url().includes('/save-activity') && response.ok());
    await dialog.getByRole('button', { name: 'Save' }).click();
    await saved;

    await expect(page.getByText('Gallery visit')).toBeVisible();
  });

  test('deletes a transportation', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip();
    await api.createRecord('transportations', {
      trip: trip.id,
      type: 'train',
      origin: 'Gare du Nord',
      destination: 'St Pancras',
      departureTime: isoDay(1),
      arrivalTime: isoDay(1),
      // The forms always write a metadata object, and the panel reads through
      // it without guarding, so seed one.
      metadata: { provider: 'Eurostar', reservation: 'EU-42' },
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).openAccordionSection('Transportation');
    await expect(page.getByText('Gare du Nord')).toBeVisible();

    await entryMenu(page, 'Delete');
    await confirmDeletion(page);

    await expect(page.getByRole('region', { name: /Transportation/ }).getByText('Gare du Nord')).toBeHidden();
    const remaining = await api.listRecords('transportations', { filter: `trip="${trip.id}"` });
    expect(remaining.totalItems).toBe(0);
  });

  test('keeps an entry when the deletion is cancelled', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip();
    await api.createRecord('activities', {
      trip: trip.id,
      name: 'Spared activity',
      address: 'Somewhere',
      startDate: isoDay(1),
      endDate: isoDay(1),
    });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).openAccordionSection('Activities');

    await entryMenu(page, 'Delete');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('Spared activity')).toBeVisible();
  });
});

test.describe('Attachments', () => {
  const pdf = {
    name: 'booking.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% a tiny pdf for the suite\n'),
  };

  test('says so when a trip has no attachments', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip();
    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).switchToTab('Attachments');

    await expect(page.getByText('No attachments yet')).toBeVisible();
  });

  test('uploads an attachment and then deletes it', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip();
    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await new ViewTripPage(page).switchToTab('Attachments');

    await page.locator('input[type="file"]').setInputFiles(pdf);
    await expect(page.getByText(pdf.name)).toBeVisible();
    await expect(page.getByText('No attachments yet')).toBeHidden();

    await page.getByRole('button', { name: 'Delete Attachment' }).click();
    const confirmation = page.getByRole('dialog').filter({ hasText: 'This action cannot be undone' });
    await confirmation.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('No attachments yet')).toBeVisible();
  });
});

test.describe('Notes', () => {
  test('edits a note that is already there', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip();
    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);

    const viewTrip = new ViewTripPage(page);
    await viewTrip.addNote('First draft');
    await expect(page.getByText('First draft')).toBeVisible();

    await viewTrip.addNote('Second draft');
    await expect(page.getByText('Second draft')).toBeVisible();
    await expect(page.getByText('First draft')).toBeHidden();
  });
});
