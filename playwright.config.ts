import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
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
    },
    {
      name: 'authenticated-tests',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /SignIn|SignUp/,
    },
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'] },
    // },
    {
      name: 'Desktop Firefox - signup and sign-in',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /SignIn|SignUp/,
    },
  ],
  webServer: [
    {
      command: 'npm run test-web',
      url: 'http://localhost:6173',
      reuseExistingServer: false,
      stdout: 'pipe',
      env: {
        VITE_POCKETBASE_ENDPOINT: 'http://127.0.0.1:8060',
      },
    },
    {
      command: 'go run . serve --http 0.0.0.0:8060',
      cwd: './backend',
      url: 'http://127.0.0.1:8060/site-settings.json',
      reuseExistingServer: false,
      timeout: 120000,
      stdout: 'pipe',
      env: {
        SURMAI_ADMIN_EMAIL: 'admin@test.surmai.app',
        SURMAI_ADMIN_PASSWORD: 'uf3u2uo3f3uuo23#$#WAIT',
        PB_DATA_DIRECTORY: './pb_test_data',
      },
    },
  ],
});
