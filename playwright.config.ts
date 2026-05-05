import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4301',
    trace: 'on-first-retry',
  },
  webServer: process.env['PW_SKIP_WEBSERVER']
    ? undefined
    : {
        command: 'npx ng serve --proxy-config proxy.conf.json --port 4301',
        url: 'http://localhost:4301',
        reuseExistingServer: !process.env['CI'],
        timeout: 300 * 1000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
