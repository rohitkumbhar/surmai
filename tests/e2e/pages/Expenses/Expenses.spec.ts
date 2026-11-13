import { isoDay, unique } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';

import type { Page } from '@playwright/test';

const openExpenses = async (page: Page, tripId: string) => {
  await page.goto(`/trips/${tripId}`);
  await page.getByRole('tab', { name: 'Expenses' }).click();
};

test.describe('Trip expenses', () => {
  test('says so when a trip has no expenses', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip();
    await signIn(page, user);
    await openExpenses(page, trip.id);

    await expect(page.getByText('No expenses yet')).toBeVisible();
    // Nothing to export either.
    await expect(page.getByRole('button', { name: 'Download CSV' })).toBeDisabled();
  });

  test('adds an expense and lists it', async ({ page, user, createTrip, signIn }) => {
    const trip = await createTrip();
    await signIn(page, user);
    await openExpenses(page, trip.id);

    await page.getByRole('button', { name: 'Add Expense' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Dinner at the port');
    await dialog.getByLabel('Amount').fill('64');

    const created = page.waitForResponse(
      (response) =>
        response.url().includes('/api/collections/trip_expenses/records') &&
        response.request().method() === 'POST' &&
        response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await created;

    await expect(page.getByText('Dinner at the port')).toBeVisible();
    await expect(page.getByText('No expenses yet')).toBeHidden();
  });

  test('edits an expense from its card', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip();
    await api.createRecord('trip_expenses', {
      trip: trip.id,
      name: 'Taxi',
      cost: { value: 20, currency: 'USD' },
      occurredOn: isoDay(1),
      category: 'transportation',
    });

    await signIn(page, user);
    await openExpenses(page, trip.id);

    await page.getByRole('button', { name: 'Edit Expense' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue('Taxi');
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Airport taxi');

    const updated = page.waitForResponse(
      (response) =>
        response.url().includes('/api/collections/trip_expenses/records') &&
        response.request().method() === 'PATCH' &&
        response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await updated;

    await expect(page.getByText('Airport taxi')).toBeVisible();
  });

  test('deletes an expense once the deletion is confirmed', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip();
    await api.createRecord('trip_expenses', {
      trip: trip.id,
      name: `Doomed ${unique()}`,
      cost: { value: 11, currency: 'USD' },
      occurredOn: isoDay(1),
    });

    await signIn(page, user);
    await openExpenses(page, trip.id);

    await page.getByRole('button', { name: 'Edit Expense' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();

    // The confirmation opens on top of the form, which has a Delete of its
    // own, so the click has to be scoped to the confirmation.
    const confirmation = page.getByRole('dialog').filter({ hasText: 'This action cannot be undone' });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('No expenses yet')).toBeVisible();
  });

  test('converts to the budget currency and totals the budget overview', async ({
    page,
    user,
    createTrip,
    signIn,
    api,
  }) => {
    // The suite seeds USD at 1 and EUR at 0.9, so 90 EUR is 100 USD.
    const trip = await createTrip({ name: `Budgeted ${unique()}` });
    await api.updateRecord('trips', trip.id, { budget: { value: 500, currency: 'USD' } });
    await api.createRecord('trip_expenses', {
      trip: trip.id,
      name: 'Hotel in dollars',
      cost: { value: 100, currency: 'USD' },
      occurredOn: isoDay(1),
      category: 'lodging',
    });
    await api.createRecord('trip_expenses', {
      trip: trip.id,
      name: 'Dinner in euros',
      cost: { value: 90, currency: 'EUR' },
      occurredOn: isoDay(2),
      category: 'food',
    });

    await signIn(page, user);
    await openExpenses(page, trip.id);

    const overview = page.getByText('Budget Overview').locator('..');
    await expect(overview.getByText('$200.00')).toBeVisible();
    await expect(overview.getByText('$500.00')).toBeVisible();
    await expect(overview.getByText('$300.00')).toBeVisible();
    await expect(page.getByText('40%')).toBeVisible();

    // Both currencies are listed, and the euro expense is shown converted.
    await expect(page.getByText('Expenses by Currency')).toBeVisible();
    await expect(page.getByText('Expenses by Category')).toBeVisible();
    await expect(page.getByText('Dinner in euros')).toBeVisible();
  });

  test('says when a trip has no budget', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip();
    await api.createRecord('trip_expenses', {
      trip: trip.id,
      name: 'Coffee',
      cost: { value: 4, currency: 'USD' },
      occurredOn: isoDay(1),
    });

    await signIn(page, user);
    await openExpenses(page, trip.id);

    await expect(page.getByText('No budget set')).toBeVisible();
  });

  test('splits an expense between the travellers on the trip', async ({ page, user, createTrip, signIn, api }) => {
    const ada = await api.createTravellerProfile(user, { legalName: 'Ada Lovelace' });
    const alan = await api.createTravellerProfile(user, { legalName: 'Alan Turing' });
    const trip = await createTrip({ travellers: [ada.id as string, alan.id as string] });

    await signIn(page, user);
    await openExpenses(page, trip.id);

    await page.getByRole('button', { name: 'Add Expense' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Groceries');
    await dialog.getByLabel('Amount').fill('50');
    await dialog.getByRole('switch', { name: 'Split expense' }).click();

    // Seeded evenly between the two travellers.
    await expect(dialog.getByText('Ada Lovelace')).toBeVisible();
    await expect(dialog.getByText('Alan Turing')).toBeVisible();
    await expect(dialog.getByText('Split total: 50.00 USD')).toBeVisible();

    const created = page.waitForResponse(
      (response) =>
        response.url().includes('/api/collections/trip_expenses/records') &&
        response.request().method() === 'POST' &&
        response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    const response = await created;

    const body = (await response.json()) as { splits: { travellerId: string; amount: number }[] };
    // The travellers come back in the API's order, not the order they were
    // seeded in, so compare them as a set.
    expect([...body.splits].sort((a, b) => a.travellerId.localeCompare(b.travellerId))).toEqual(
      [
        { travellerId: ada.id as string, amount: 25 },
        { travellerId: alan.id as string, amount: 25 },
      ].sort((a, b) => a.travellerId.localeCompare(b.travellerId))
    );
  });

  test('will not save splits that do not add up', async ({ page, user, createTrip, signIn, api }) => {
    const ada = await api.createTravellerProfile(user, { legalName: 'Ada Lovelace' });
    const alan = await api.createTravellerProfile(user, { legalName: 'Alan Turing' });
    const trip = await createTrip({ travellers: [ada.id as string, alan.id as string] });

    await signIn(page, user);
    await openExpenses(page, trip.id);

    await page.getByRole('button', { name: 'Add Expense' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Groceries');
    await dialog.getByLabel('Amount').fill('50');
    await dialog.getByRole('switch', { name: 'Split expense' }).click();

    // Each traveller's share is a number input seeded with half the total.
    await dialog.locator('input[value="25"]').first().fill('5');

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.getByText(/must equal the total cost/)).toBeVisible();
  });

  test('downloads the expenses as a csv', async ({ page, user, createTrip, signIn, api }) => {
    const trip = await createTrip({ name: `Csv ${unique()}` });
    await api.createRecord('trip_expenses', {
      trip: trip.id,
      name: 'Coffee',
      cost: { value: 4, currency: 'USD' },
      occurredOn: isoDay(1),
    });

    await signIn(page, user);
    await openExpenses(page, trip.id);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).click();
    const file = await download;

    expect(file.suggestedFilename()).toBe(`trip-${trip.name}-expenses.csv`);
  });
});
