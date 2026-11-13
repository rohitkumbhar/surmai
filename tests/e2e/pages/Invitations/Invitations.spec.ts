import { expect, test } from '@tests/e2e/fixtures/test';

/**
 * The invitations page, against real invitations rather than mocked responses.
 *
 * The page used to be tested by intercepting the list request. Those mocks
 * interfered with each other once several of them ran in the same file, and a
 * seeded invitation exercises the hook that fills in the sender and trip
 * details as well, which a canned response cannot.
 */
test.describe('Invitations Page', () => {
  test('shows the page header', async ({ page, user, signIn }) => {
    await signIn(page, user);
    await page.goto('/invitations');

    await expect(page.locator('#app-header').getByText('Invitations')).toBeVisible();
  });

  test('shows the empty state when there is nothing pending', async ({ page, user, signIn }) => {
    await signIn(page, user);
    await page.goto('/invitations');

    await expect(page.getByText('You do not have any pending invitations.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View All Trips' })).toBeVisible();
  });

  test('the empty state leads back to the trip list', async ({ page, user, signIn }) => {
    await signIn(page, user);
    await page.goto('/invitations');

    await page.getByRole('button', { name: 'View All Trips' }).click();

    // the button goes to the home page, which is where trips are listed
    await page.waitForURL((url) => url.pathname === '/');
  });

  test('renders a card for each invitation', async ({ page, user, createUser, createTrip, signIn, apiAs }) => {
    const invitee = await createUser('invitee');
    const first = await createTrip({ name: 'Summer Vacation', description: 'A fun trip to the beach' });
    const second = await createTrip({ name: 'Business Conference' });

    await apiAs(user).inviteCollaborator(first.id, invitee.email, 'Please join my trip!');
    await apiAs(user).inviteCollaborator(second.id, invitee.email, 'Come along');

    await signIn(page, invitee);
    await page.goto('/invitations');

    await expect(page.getByText('Summer Vacation')).toBeVisible();
    await expect(page.getByText('A fun trip to the beach')).toBeVisible();
    await expect(page.getByText('Business Conference')).toBeVisible();
    // the hook fills in who sent it
    await expect(page.getByText(user.name, { exact: false }).first()).toBeVisible();
  });

  test('accepting an invitation clears it from the list', async ({
    page,
    user,
    createUser,
    createTrip,
    signIn,
    apiAs,
  }) => {
    const invitee = await createUser('invitee');
    const trip = await createTrip({ name: 'Accepted Trip' });
    await apiAs(user).inviteCollaborator(trip.id, invitee.email);

    await signIn(page, invitee);
    await page.goto('/invitations');
    await expect(page.getByText('Accepted Trip')).toBeVisible();

    await page.getByRole('button', { name: 'Accept' }).click();

    await expect(page.getByText('You do not have any pending invitations.')).toBeVisible();

    const invitations = await apiAs(invitee).listRecords('invitations');
    expect(invitations.items[0].status).toBe('accepted');
  });

  test('rejecting an invitation clears it from the list', async ({
    page,
    user,
    createUser,
    createTrip,
    signIn,
    apiAs,
  }) => {
    const invitee = await createUser('invitee');
    const trip = await createTrip({ name: 'Rejected Trip' });
    await apiAs(user).inviteCollaborator(trip.id, invitee.email);

    await signIn(page, invitee);
    await page.goto('/invitations');
    await expect(page.getByText('Rejected Trip')).toBeVisible();

    await page.getByRole('button', { name: 'Reject' }).click();

    await expect(page.getByText('You do not have any pending invitations.')).toBeVisible();

    const invitations = await apiAs(invitee).listRecords('invitations');
    expect(invitations.items[0].status).toBe('rejected');
  });
});
