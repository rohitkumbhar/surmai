import { expect, test } from '@playwright/test';

// Use the authenticated project for all tests in this file
// test.use({ project: 'authenticated' });

test.describe('Invitations Page', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(msg.text()));

    // Navigate to the invitations page before each test
    await page.goto('/invitations');
  });

  test('should display the invitations page with header', async ({ page }) => {
    // Check that the page header is correct
    await expect(page.locator('#app-header').getByText('Invitations')).toBeVisible();
  });

  test('should show empty state when there are no invitations', async ({ page }) => {
    // Mock the API to return an empty array of invitations
    await page.route('**/api/collections/invitations/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 50,
          totalItems: 0,
          totalPages: 1,
          items: [],
        }),
      });
    });

    // Check that the empty state message is shown
    await expect(page.getByText('You do not have any pending invitations.')).toBeVisible();

    // Check that the "View All Trips" button is visible
    await expect(page.getByRole('button', { name: 'View All Trips' })).toBeVisible();
  });

  test('should navigate to all trips when clicking the "View All Trips" button', async ({ page }) => {
    // Mock the API to return an empty array of invitations
    await page.route('**/api/collections/invitations/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 50,
          totalItems: 0,
          totalPages: 1,
          items: [],
        }),
      });
    });

    // Click on the "View All Trips" button
    await page.getByRole('button', { name: 'View All Trips' }).click();

    // Check that we've navigated to the home page
    await expect(page.url()).toContain('/');
  });

  test('should render invitation cards when invitations are available', async ({ page }) => {
    // Mock the API to return a list of invitations
    await page.route('**/api/collections/invitations/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 50,
          totalItems: 2,
          totalPages: 1,
          items: [
            {
              id: 'invitation1',
              message: 'Please join my trip!',
              from: 'user1',
              trip: 'trip1',
              metadata: {
                trip: {
                  name: 'Summer Vacation',
                  description: 'A fun trip to the beach',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
                sender: {
                  name: 'John Doe',
                },
              },
              status: 'open',
              created: new Date().toISOString(),
            },
            {
              id: 'invitation2',
              message: 'Join our business trip',
              from: 'user2',
              trip: 'trip2',
              metadata: {
                trip: {
                  name: 'Business Conference',
                  description: 'Annual industry conference',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                },
                sender: {
                  name: 'Jane Smith',
                },
              },
              status: 'open',
              created: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Check that the invitation cards are rendered
    await expect(page.getByText('Summer Vacation')).toBeVisible();
    await expect(page.getByText('A fun trip to the beach')).toBeVisible();
    await expect(page.getByText('Please join my trip!')).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();

    await expect(page.getByText('Business Conference')).toBeVisible();
    await expect(page.getByText('Annual industry conference')).toBeVisible();
    await expect(page.getByText('Join our business trip')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();

    // Check that the Accept and Reject buttons are visible for each invitation
    const acceptButtons = await page.getByRole('button', { name: 'Accept' }).all();
    expect(acceptButtons.length).toBe(2);

    const rejectButtons = await page.getByRole('button', { name: 'Reject' }).all();
    expect(rejectButtons.length).toBe(2);
  });

  test('should handle accepting an invitation', async ({ page }) => {
    // Mock the API to return a list with one invitation
    await page.route('**/api/collections/invitations/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 50,
          totalItems: 1,
          totalPages: 1,
          items: [
            {
              id: 'invitation1',
              message: 'Please join my trip!',
              from: 'user1',
              trip: 'trip1',
              metadata: {
                trip: {
                  name: 'Summer Vacation',
                  description: 'A fun trip to the beach',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
                sender: {
                  name: 'John Doe',
                },
              },
              status: 'open',
              created: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Mock the update API call for accepting the invitation
    let updatePayload;
    await page.route('**/api/collections/invitations/records/invitation1', async (route) => {
      updatePayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'invitation1',
          status: 'accepted',
        }),
      });
    });

    // Click the Accept button
    await page.getByRole('button', { name: 'Accept' }).click();
    await page.waitForResponse(/invitation1/);
    // Check that the update API was called with the correct payload
    expect(updatePayload).toHaveProperty('status', 'accepted');

    // Check that a success notification is shown
    await expect(page.getByText('Invitation updated')).toBeVisible();
  });

  test('should handle rejecting an invitation', async ({ page }) => {
    // Mock the API to return a list with one invitation
    await page.route('**/api/collections/invitations/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 50,
          totalItems: 1,
          totalPages: 1,
          items: [
            {
              id: 'invitation1',
              message: 'Please join my trip!',
              from: 'user1',
              trip: 'trip1',
              metadata: {
                trip: {
                  name: 'Summer Vacation',
                  description: 'A fun trip to the beach',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
                sender: {
                  name: 'John Doe',
                },
              },
              status: 'open',
              created: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Mock the update API call for rejecting the invitation
    let updatePayload;
    await page.route('**/api/collections/invitations/records/invitation1', async (route) => {
      updatePayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'invitation1',
          status: 'rejected',
        }),
      });
    });

    // Click the Reject button
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.waitForResponse(/invitation1/);
    // Check that the update API was called with the correct payload
    expect(updatePayload).toHaveProperty('status', 'rejected');

    // Check that a success notification is shown
    await expect(page.getByText('Invitation updated')).toBeVisible();
  });
});
