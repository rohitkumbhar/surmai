import { expect, test } from '@tests/e2e/fixtures/test';

import type { Page } from '@playwright/test';
import type { SeededUser, SurmaiApi } from '@tests/e2e/fixtures/api';

/**
 * The whole sharing flow across two users: the owner invites, the invitee
 * accepts, and only then can they open the trip. A third user never can.
 */
test.describe('Trip collaboration', () => {
  test('an invitation lets a second user open the trip', async ({
    page,
    user,
    createUser,
    createTrip,
    signIn,
    apiAs,
  }) => {
    const trip = await createTrip({ name: 'Shared Trip' });
    const invitee = await createUser('invitee');

    await apiAs(user).inviteCollaborator(trip.id, invitee.email);

    // before accepting, the trip is not theirs to see
    await signIn(page, invitee);
    await page.goto(`/trips/${trip.id}`);
    await expect(page.getByText('Shared Trip')).toBeHidden();

    await page.goto('/invitations');
    await expect(page.getByText('Shared Trip', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Accept' }).first().click();

    // the collaborator is only added once the accept has been written, so
    // wait for the list to empty before asking for the trip
    await expect(page.getByText('You do not have any pending invitations.')).toBeVisible();

    await page.goto(`/trips/${trip.id}`);
    await expect(page.locator('#app-header').getByText('Shared Trip')).toBeVisible();
  });

  test('a rejected invitation does not grant access', async ({ page, user, createUser, createTrip, signIn, apiAs }) => {
    const trip = await createTrip({ name: 'Declined Trip' });
    const invitee = await createUser('invitee');

    await apiAs(user).inviteCollaborator(trip.id, invitee.email);

    await signIn(page, invitee);
    await page.goto('/invitations');
    await expect(page.getByText('Declined Trip', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Reject' }).first().click();
    await expect(page.getByText('You do not have any pending invitations.')).toBeVisible();

    await page.goto(`/trips/${trip.id}`);
    await expect(page.getByText('Declined Trip')).toBeHidden();
  });

  test('an unrelated user cannot open the trip', async ({ page, createUser, createTrip, signIn }) => {
    const trip = await createTrip({ name: 'Nobody Elses Trip' });
    const stranger = await createUser('stranger');

    await signIn(page, stranger);
    await page.goto(`/trips/${trip.id}`);

    await expect(page.getByText('Nobody Elses Trip')).toBeHidden();
  });

  test('a collaborator is listed on the trip', async ({ page, user, createUser, createTrip, signIn, apiAs }) => {
    const trip = await createTrip({ name: 'Listed Trip' });
    const invitee = await createUser('invitee');

    await apiAs(user).inviteCollaborator(trip.id, invitee.email);

    // accept as the invitee, through the API this time
    const invitations = await apiAs(invitee).listRecords('invitations');
    const invitation = invitations.items[0];
    await apiAs(invitee).updateRecord('invitations', invitation.id as string, { status: 'accepted' });

    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await expect(page.locator('#app-header').getByText('Listed Trip')).toBeVisible();
  });
});

test.describe('Working on a shared trip', () => {
  /** Invites someone and accepts on their behalf, leaving them signed in. */
  const share = async (
    page: Page,
    tripId: string,
    owner: SeededUser,
    invitee: SeededUser,
    apiAs: (user: SeededUser) => SurmaiApi,
    signIn: (page: Page, user: SeededUser) => Promise<void>
  ) => {
    await apiAs(owner).inviteCollaborator(tripId, invitee.email);
    await signIn(page, invitee);
    await page.goto('/invitations');
    await page.getByRole('button', { name: 'Accept' }).first().click();
    await expect(page.getByText('You do not have any pending invitations.')).toBeVisible();
  };

  test('a collaborator can change the trip', async ({ page, user, createUser, createTrip, signIn, apiAs }) => {
    const trip = await createTrip({ name: 'Jointly planned' });
    const invitee = await createUser('editor');
    await share(page, trip.id, user, invitee, apiAs, signIn);

    await page.goto(`/trips/${trip.id}`);
    await page.getByRole('button', { name: /Basic Information/i }).click();
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Renamed by the collaborator');

    const saved = page.waitForResponse(
      (response) => response.url().includes(`/api/collections/trips/records/${trip.id}`) && response.ok()
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await saved;

    await expect(page.locator('#app-header').getByText('Renamed by the collaborator')).toBeVisible();
  });

  test('the owner can take a collaborator off the trip', async ({
    page,
    user,
    createUser,
    createTrip,
    signIn,
    apiAs,
  }) => {
    const trip = await createTrip({ name: 'Shared then not' });
    const invitee = await createUser('removed');
    await share(page, trip.id, user, invitee, apiAs, signIn);

    // Back to the owner, who opens the collaborator list and removes them.
    await signIn(page, user);
    await page.goto(`/trips/${trip.id}`);
    await page.getByRole('button', { name: /Basic Information/i }).click();

    // The collaborators are chips in the panel itself; the Collaborators item
    // on the Actions menu only opens the invitation form.
    await expect(page.getByText(invitee.email)).toBeVisible();
    await page.getByRole('button', { name: 'Delete Collaborator' }).first().click();
    const confirmation = page.getByRole('dialog').filter({ hasText: 'This action cannot be undone' });
    await confirmation.getByRole('button', { name: 'Delete' }).click();

    await expect
      .poll(async () => {
        const trips = await apiAs(user).listRecords('trips', { filter: `id="${trip.id}"` });
        return ((trips.items[0] as { collaborators?: string[] }).collaborators || []).length;
      })
      .toBe(0);
  });
});
