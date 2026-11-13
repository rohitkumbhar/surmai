import { unique } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';

test.describe('Traveller profiles', () => {
  test('creates a profile and lists it', async ({ page, user, signIn, apiAs }) => {
    const name = `Ada Lovelace ${unique()}`;

    await signIn(page, user);
    await page.goto('/travellers');

    await page.getByRole('button', { name: 'Add Profile' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Official Name').fill(name);
    await dialog.getByLabel('Email').fill(`${unique()}@example.com`);
    await dialog.getByLabel('Passport ID').fill('X1234567');

    const created = page.waitForResponse(
      (response) =>
        response.url().includes('/api/collections/traveller_profiles/records') &&
        response.request().method() === 'POST' &&
        response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await created;

    await expect(page.getByText(name)).toBeVisible();

    const profiles = await apiAs(user).listRecords('traveller_profiles', { filter: `legalName="${name}"` });
    expect(profiles.totalItems).toBe(1);
  });

  test('renames a profile', async ({ page, user, signIn, api }) => {
    await api.createTravellerProfile(user, { legalName: 'Grace Hopper' });

    await signIn(page, user);
    await page.goto('/travellers');
    await expect(page.getByText('Grace Hopper')).toBeVisible();

    // The name opens a read-only view of the profile, which offers the form.
    await page.getByText('Grace Hopper').click();
    const view = page.getByRole('dialog');
    await expect(view.getByRole('heading', { name: 'Traveler Profile' })).toBeVisible();
    await view.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Official Name').fill('Rear Admiral Hopper');

    const updated = page.waitForResponse(
      (response) =>
        response.url().includes('/api/collections/traveller_profiles/records') &&
        response.request().method() === 'PATCH' &&
        response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await updated;

    await expect(page.getByText('Rear Admiral Hopper')).toBeVisible();
  });

  test('deletes a profile once the deletion is confirmed', async ({ page, user, signIn, api, apiAs }) => {
    const legalName = `Doomed ${unique()}`;
    await api.createTravellerProfile(user, { legalName });

    await signIn(page, user);
    await page.goto('/travellers');
    await expect(page.getByText(legalName)).toBeVisible();

    await page.getByRole('row', { name: new RegExp(legalName) }).getByRole('button').last().click();

    const confirmation = page.getByRole('dialog').filter({ hasText: 'Are you sure you want to delete' });
    await confirmation.getByRole('button', { name: 'Confirm' }).click();
    await expect(confirmation).toBeHidden();

    const remaining = await apiAs(user).listRecords('traveller_profiles', { filter: `legalName="${legalName}"` });
    expect(remaining.totalItems).toBe(0);
  });

  test('assigns a profile to a trip', async ({ page, user, createTrip, signIn, api }) => {
    const profile = await api.createTravellerProfile(user, { legalName: 'Alan Turing' });
    const trip = await createTrip({ travellers: [profile.id as string] });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await page.getByRole('button', { name: /Basic Information/i }).click();

    await expect(page.getByRole('region', { name: /Basic Information/ }).getByText('Alan Turing')).toBeVisible();
  });
});
