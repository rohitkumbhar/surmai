import { expect, test } from '@playwright/test';
import { nanoid } from 'nanoid';

test.describe('SignUp Page', () => {
  test.beforeEach(async ({ page }) => {
    // page.on('console', (msg) => console.log(msg.text()));

    // Navigate to the sign-up page before each test
    await page.goto('/register');
  });

  test('should display the sign-up form', async ({ page }) => {
    // Check that the page title is correct
    await expect(page.getByRole('button', { name: 'Create An Account' })).toBeVisible();

    // Check that the form elements are visible
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create An Account' })).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Enter invalid email and submit
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123!');
    await page.getByRole('button', { name: 'Create An Account' }).click();

    // Check that validation error is shown
    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('should show API error for account creation failure', async ({ page }) => {
    // Mock the API to return an error
    await page.route('**/api/collections/users/records', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Email already exists',
        }),
      });
    });

    // Fill in the form with valid data
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@surmai.app');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123!');
    await page.getByRole('button', { name: 'Create An Account' }).click();

    // Check that API error notification is shown
    await expect(page.getByText('Unable to create an account')).toBeVisible();
    await expect(page.getByText('Email already exists')).toBeVisible();
  });

  test('should navigate to login page after successful account creation', async ({ page }) => {
    // Fill in the form with valid data
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(`test-${nanoid(5)}@surmai.app`);
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123!');
    await page.getByRole('button', { name: 'Create An Account' }).click();

    await page.waitForSelector('text=Welcome to Surmai');
    // Check that we've navigated to the login page
    await expect(page.url()).toContain('/login');
  });

  test('should disable signup when signups are disabled', async ({ page }) => {
    // Mock the context to disable signups
    await page.route('*/**/site-settings.json', async (route) => {
      const json = {
        demoMode: false,
        emailEnabled: true,
        signupsEnabled: false,
        offline: false,
      };
      await route.fulfill({ json });
    });

    // Reload the page to apply the settings
    await page.reload();

    // Check that the signup button is disabled and the message is shown
    await expect(page.getByText('Signups are disabled for this instance')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create An Account' })).toBeDisabled();
  });

  test('should enable signup with invitation code even when signups are disabled', async ({ page }) => {
    // Mock the context to disable signups
    await page.route('*/**/site-settings.json', async (route) => {
      const json = {
        demoMode: false,
        emailEnabled: true,
        signupsEnabled: false,
        offline: false,
      };
      await route.fulfill({ json });
    });

    // Navigate to the signup page with an invitation code
    await page.goto('/register?code=test-invitation-code');

    // Check that the signup button is enabled despite signups being disabled
    await expect(page.getByRole('button', { name: 'Create An Account' })).toBeEnabled();
  });

  test('should include invitation code in signup request', async ({ page }) => {
    // Set up a request interceptor to check the payload
    let requestPayload;
    await page.route('**/api/surmai/create-user', async (route) => {
      requestPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: '123' }),
      });
    });

    // Navigate to the signup page with an invitation code
    await page.goto('/register?code=test-invitation-code');

    // Fill in the form and submit
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@surmai.app');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123!');
    await page.getByRole('button', { name: 'Create An Account' }).click();

    await page.waitForResponse(/create-user/);
    // Check that the invitation code was included in the request
    expect(requestPayload).toHaveProperty('invitationCode', 'test-invitation-code');
  });
});
