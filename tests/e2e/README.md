# Playwright Tests

This directory contains Playwright tests for the Surmai application.

## Setup

The tests are configured to run against a local instance of the application. The application must be running before the tests can be executed.

## Authentication

Some tests require authentication. The authentication is handled by a global setup that logs in with the credentials provided via environment variables and stores the authentication state for use in tests.

### Environment Variables

The following environment variables can be used to configure the authentication:

- `TEST_USER_EMAIL`: The email address of the user to log in with. Defaults to `admin@test.surmai.app`.
- `TEST_USER_PASSWORD`: The password of the user to log in with. Defaults to `uf3u2uo3f3uuo23#$#WAIT`.

### Authenticated Tests

To run tests with authentication, use the `authenticated` project:

```typescript
// Use the authenticated project for all tests in this file
test.use({ project: 'authenticated' });
```

This will use the authentication state set up by the global setup, so the tests don't need to log in individually.

## Running Tests

To run the tests, use the following command:

```bash
npx playwright test
```

To run a specific test file, use:

```bash
npx playwright test tests/pages/Invitations/Invitations.spec.ts
```

To run tests with a specific project, use:

```bash
npx playwright test --project=authenticated
```

## Test Structure

Each test file should follow this structure:

1. Import the necessary modules
2. Set up the test environment (e.g., use the authenticated project)
3. Define the tests using `test.describe` and `test` functions
4. Clean up after the tests if necessary

Example:

```typescript
import { expect, test } from '@playwright/test';

// Use the authenticated project for all tests in this file
test.use({ project: 'authenticated' });

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Set up for each test
  });

  test('should do something', async ({ page }) => {
    // Test code
  });
});
```