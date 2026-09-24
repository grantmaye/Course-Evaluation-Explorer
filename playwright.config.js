import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4100', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm start', url: 'http://127.0.0.1:4100/api/health', reuseExistingServer: !process.env.CI },
});
