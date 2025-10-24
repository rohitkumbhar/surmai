import { expect, test } from '@playwright/test';

test.describe('SignIn Page', () => {
  test.beforeEach(async ({ page }) => {
    // page.on('console', (msg) => console.log(msg.text()));

    // Navigate to the sign-in page before each test
    await page.goto('/signin');
  });

  test('should display the sign-in form', async ({ page }) => {
    // Check that the page title is correct
    await expect(page.getByText('Welcome to Surmai')).toBeVisible();

    // Check that the form elements are visible
    await expect(page.getByTestId('email')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot Password' })).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Enter invalid email and submit
    await page.getByTestId('email').fill('invalid-email');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check that validation error is shown
    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('should show API error for invalid credentials', async ({ page }) => {
    // Enter valid email format but incorrect credentials
    await page.getByTestId('email').fill('test@surmai.app');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check that API error notification is shown
    await expect(page.getByText('Unable to sign in')).toBeVisible();
  });

  test('should navigate to registration page when "Create An Account" is clicked', async ({ page }) => {
    // Click on the "Create An Account" link
    await page.getByRole('button', { name: 'Create An Account' }).click();

    // Check that we've navigated to the registration page
    await expect(page.url()).toContain('/register');
  });

  test('should open forgot password modal when "Forgot Password" is clicked', async ({ page }) => {
    // Click on the "Forgot Password" link
    await page.getByRole('button', { name: 'Forgot Password' }).click();

    // Check that the modal is visible
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    await expect(page.getByText('Enter the email address associated with your account')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Password' })).toBeVisible();
  });

  test('should submit forgot password request', async ({ page }) => {
    // Click on the "Forgot Password" link
    await page.getByRole('button', { name: 'Forgot Password' }).click();

    // Fill in the email address and submit
    await page.getByTestId('resetEmailAddress').fill('test@surmai.app');
    await page.getByRole('button', { name: 'Reset Password' }).click();

    // Check that success notification is shown
    await expect(page.getByText('Your password reset request has been submitted')).toBeVisible();
  });

  test('should successfully sign in with valid credentials', async ({ page }) => {
    // Enter valid credentials and submit
    await page.getByTestId('email').fill('admin@test.surmai.app');
    await page.getByRole('textbox', { name: 'Password' }).fill('uf3u2uo3f3uuo23#$#WAIT');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check that we've navigated to the home page
    await expect(page.getByText('All future trips ordered by start date')).toBeVisible();
  });

  test('should display OAuth providers if available', async ({ page }) => {
    // Mock the auth methods response to include OAuth providers
    await page.route(/auth-methods/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          password: {
            enabled: true,
          },
          oauth2: {
            enabled: true,
            providers: [
              { name: 'google', displayName: 'Google' },
              { name: 'github', displayName: 'GitHub' },
            ],
          },
        }),
      });
    });

    // Check that OAuth buttons are visible
    await expect(page.getByRole('button', { name: 'Sign In With Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In With GitHub' })).toBeVisible();
  });

  test('should display demo credentials in demo mode', async ({ page }) => {
    // Mock the context to enable demo mode

    await page.route('*/**/site-settings.json', async (route) => {
      const json = {
        demoMode: true,
        emailEnabled: true,
        signupsEnabled: true,
        offline: false,
      };
      await route.fulfill({ json });
    });

    // Reload the page to apply the demo mode
    await page.reload();

    // Check that demo credentials are visible
    await expect(page.getByText('Demo User: demo@surmai.app')).toBeVisible();
    await expect(page.getByText('Demo Password: vi#c8Euuf16idhbG')).toBeVisible();
  });
});
