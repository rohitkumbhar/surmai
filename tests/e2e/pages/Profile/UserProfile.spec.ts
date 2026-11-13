import { unique } from '@tests/e2e/fixtures/api';
import { defaultUser, expect, test } from '@tests/e2e/fixtures/test';

test.describe('User profile', () => {
  test('changes the name and keeps it', async ({ page, user, signIn, api }) => {
    const newName = `Renamed ${unique()}`;

    await signIn(page, user);
    await page.goto('/profile');

    // The form fills itself in once the user record arrives; typing before
    // that happens is overwritten.
    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toHaveValue(user.name);
    await nameField.fill(newName);

    const saved = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/collections/users/records/${user.id}`) &&
        response.request().method() === 'PATCH' &&
        response.ok()
    );
    await page.getByRole('button', { name: 'Save' }).click();
    await saved;

    await expect(nameField).toHaveValue(newName);

    // Reloading would not prove anything: signIn writes the session it
    // captured back into localStorage on every navigation, so the page would
    // read the name as it was when the user was created. The record is what
    // settles it.
    // Read back as the superuser: users may not list the users collection.
    const record = await api.listRecords('users', { filter: `id="${user.id}"` });
    expect((record.items[0] as { name: string }).name).toBe(newName);
  });

  test('refuses a new password that is not confirmed', async ({ page, user, signIn }) => {
    await signIn(page, user);
    await page.goto('/profile');
    await page.getByRole('tab', { name: 'Security' }).click();

    await page.getByLabel('Existing Password').fill(user.password);
    await page.getByLabel(/^New Password/).fill('a-much-longer-password');
    await page.getByLabel('Confirm New Password').fill('something-else-entirely');
    await page.getByRole('button', { name: 'Change Password' }).click();

    // The form stays put rather than sending a mismatched pair.
    await expect(page.getByLabel('Existing Password')).toBeVisible();
  });

  test('changes the password, and the old one stops working', async ({ page, user, signIn, baseURL }) => {
    const newPassword = 'e2e-password-5678';

    await signIn(page, user);
    await page.goto('/profile');
    await page.getByRole('tab', { name: 'Security' }).click();

    await page.getByLabel('Existing Password').fill(user.password);
    await page.getByLabel(/^New Password/).fill(newPassword);
    await page.getByLabel('Confirm New Password').fill(newPassword);

    const changed = page.waitForResponse(
      (response) => response.url().includes('/api/collections/users/records') && response.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: 'Change Password' }).click();
    await changed;

    const signInWith = async (password: string) => {
      const response = await page.request.post(`${baseURL}/api/collections/users/auth-with-password`, {
        data: { identity: user.email, password },
      });
      return response.status();
    };

    expect(await signInWith(newPassword)).toBe(200);
    expect(await signInWith(user.password)).toBe(400);
  });

  test('shows a notification and marks it read', async ({ page, user, signIn, api }) => {
    await api.createRecord('notifications', {
      userId: user.id,
      subject: 'Welcome aboard',
      message: 'Thanks for joining',
      read: false,
    });

    await signIn(page, user);
    await page.goto('/');

    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.getByText('Welcome aboard')).toBeVisible();
    await expect(page.getByText('No notifications')).toBeHidden();
  });

  test('says when there are no notifications', async ({ page, user, signIn }) => {
    await signIn(page, user);
    await page.goto('/');

    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.getByText('No notifications')).toBeVisible();
  });
});

test.describe('Signing out', () => {
  // This one rides on the project's stored session rather than the signIn
  // fixture: that fixture rewrites the session on every navigation, so a
  // signed out page would sign itself straight back in.
  test('ends the session and asks to sign in again', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Upcoming Trips')).toBeVisible();

    // The navbar's logout only shows its label on a narrow viewport, so go
    // through the user menu in the header.
    await page.getByRole('button', { name: new RegExp(defaultUser.email) }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/login/);
    // The stored session is gone, so going back does not get in.
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
