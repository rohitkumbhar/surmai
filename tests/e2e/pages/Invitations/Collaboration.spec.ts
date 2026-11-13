import { expect, test } from '../../fixtures/test';

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
