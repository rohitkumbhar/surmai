import { unique } from '@tests/e2e/fixtures/api';
import { expect, test } from '@tests/e2e/fixtures/test';

/**
 * The user list is 25 to a page, sorted by name, and the test backend keeps
 * its users between runs. A user that has to be visible is therefore given a
 * name that sorts ahead of everything else, and taken away afterwards.
 */
const firstOnTheList = () => `!e2e ${unique()}`;

test.describe('Users', () => {
  test('lists the users of the instance with their actions', async ({
    page,
    user,
    signInAsSuperuser,
    api,
  }) => {
    const name = firstOnTheList();
    const other = await api.createUser(`listed-${unique()}@example.com`, 'e2e-password-1234', name);

    await signInAsSuperuser(page, user);
    await page.goto('/settings');

    await expect(page.getByText(other.email)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(other.email) }).getByRole('button')).toHaveCount(2);

    await api.deleteRecord('users', other.id);
  });

  test('invites a user and hands back a registration link', async ({ page, user, signInAsSuperuser }) => {
    await signInAsSuperuser(page, user);
    await page.goto('/settings');

    await page.getByRole('button', { name: 'Invite User' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Email Address' }).fill(`invited-${unique()}@example.com`);
    // The message is required as well.
    await dialog.getByRole('textbox', { name: 'Message' }).fill('Come and plan a trip with us');

    const invited = page.waitForResponse(
      (response) => response.url().includes('/api/surmai/settings/invite-user') && response.ok()
    );
    await dialog.getByRole('button', { name: 'Send Invitation' }).click();
    await invited;

    // The modal shows the code to pass on, since mail may not be configured.
    await expect(dialog.getByText(/register\?code=/)).toBeVisible();
  });

  test('deletes a user once the deletion is confirmed', async ({ page, user, signInAsSuperuser, api }) => {
    const doomed = await api.createUser(`doomed-${unique()}@example.com`, 'e2e-password-1234', firstOnTheList());

    await signInAsSuperuser(page, user);
    await page.goto('/settings');
    await expect(page.getByText(doomed.email)).toBeVisible();

    await page.getByRole('row', { name: new RegExp(doomed.email) }).getByRole('button', { name: 'Delete User' }).click();

    const confirmation = page.getByRole('dialog').filter({ hasText: 'This action cannot be undone' });
    await confirmation.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText(doomed.email)).toBeHidden();
    const remaining = await api.listRecords('users', { filter: `id="${doomed.id}"` });
    expect(remaining.totalItems).toBe(0);
  });
});

test.describe('Announcements', () => {
  test('creates an announcement, which reaches a user as a notification', async ({
    page,
    user,
    signInAsSuperuser,
    apiAs,
  }) => {
    const subject = `Scheduled maintenance ${unique()}`;

    await signInAsSuperuser(page, user);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Announcements' }).click();

    await page.getByRole('button', { name: 'Create Announcement' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Subject' }).fill(subject);
    await dialog.getByRole('textbox', { name: 'Summary (Short Text)' }).fill('Back in an hour');

    const created = page.waitForResponse(
      (response) =>
        response.url().includes('/api/collections/announcements/records') &&
        response.request().method() === 'POST' &&
        response.ok()
    );
    await dialog.getByRole('button', { name: 'Create' }).click();
    await created;

    await expect(page.getByRole('cell', { name: subject })).toBeVisible();

    // A hook turns every announcement into a notification for each user.
    await expect
      .poll(async () => {
        const notifications = await apiAs(user).listRecords('notifications', { filter: `subject="${subject}"` });
        return notifications.totalItems;
      })
      .toBe(1);
  });
});
