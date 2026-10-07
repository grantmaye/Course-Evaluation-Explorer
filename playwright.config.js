import { defineConfig, devices } from '@playwright/test';
const port = process.env.E2E_PORT || '4100';
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './test/browser', workers: 1,
  use: { baseURL, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm start', env: { PORT: port, DB_DRIVER: 'sqlite' }, url: `${baseURL}/api/health`, reuseExistingServer: false },
});
