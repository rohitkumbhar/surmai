import { defineConfig, devices } from '@playwright/test';

const mockServicesPort = Number(process.env.MOCK_SERVICES_PORT || 8099);
const mockServicesUrl = `http://127.0.0.1:${mockServicesPort}`;
const backendUrl = process.env.PLAYWRIGHT_TEST_BACKEND || 'http://127.0.0.1:8060';
const frontendUrl = 'http://localhost:6173';

const superuserEmail = process.env.SURMAI_ADMIN_EMAIL || 'admin@test.surmai.app';
const superuserPassword = process.env.SURMAI_ADMIN_PASSWORD || 'uf3u2uo3f3uuo23#$#WAIT';

export default defineConfig({
  testDir: './tests/e2e',
  // Tests seed their own users and trips, so they do not share state.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One dev server and one SQLite backend serve every worker, so leave some
  // headroom rather than taking a worker per core.
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['html'], ['github']] : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    headless: true,
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
      timeout: 120_000,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        storageState: 'tests/playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.setup\.ts/, /SignIn|SignUp/],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        storageState: 'tests/playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.setup\.ts/, /SignIn|SignUp/],
    },
    {
      // The sign-in and sign-up screens need to start signed out.
      name: 'anonymous',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /SignIn|SignUp/,
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: `node tests/e2e/mock-services/server.mjs`,
      name: 'mock services',
      url: `${mockServicesUrl}/health`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_SERVICES_PORT: String(mockServicesPort) },
    },
    {
      command: 'go run . serve --http 0.0.0.0:8060',
      name: 'backend',
      cwd: './backend',
      url: `${backendUrl}/site-settings.json`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        SURMAI_ADMIN_EMAIL: superuserEmail,
        SURMAI_ADMIN_PASSWORD: superuserPassword,
        PB_DATA_DIRECTORY: './pb_test_data',
      },
    },
    {
      command: 'pnpm test-web:preview',
      name: 'frontend',
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { PLAYWRIGHT_TEST_BACKEND: backendUrl },
    },
  ],
});
