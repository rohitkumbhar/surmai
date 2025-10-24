import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    headless: true,
    baseURL: 'http://localhost:6173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      timeout: 5 * 60000,
      // use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'authenticated-tests',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/playwright/.auth/user.json',
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
      testIgnore: /SignIn|SignUp/,
    },
    {
      name: 'Desktop Firefox - signup and sign-in',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /SignIn|SignUp/,
    },
  ],
  webServer: [
    {
      command: 'pnpm test-web',
      name: 'frontend',
      url: 'http://localhost:6173',
      reuseExistingServer: false,
      // stdout: 'pipe',
      env: {
        PLAYWRIGHT_TEST_BACKEND: 'http://127.0.0.1:8060',
      },
    },
    {
      command: 'go run . serve --http 0.0.0.0:8060',
      name: 'backend',
      cwd: './backend',
      url: 'http://127.0.0.1:8060/site-settings.json',
      reuseExistingServer: false,
      timeout: 120000,
      // stdout: 'pipe',
      env: {
        SURMAI_ADMIN_EMAIL: 'admin@test.surmai.app',
        SURMAI_ADMIN_PASSWORD: 'uf3u2uo3f3uuo23#$#WAIT',
        PB_DATA_DIRECTORY: './pb_test_data',
      },
    },
  ],
});
