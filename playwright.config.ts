import { defineConfig } from '@playwright/test';
export default defineConfig({
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } }, { name: 'mobile', use: { viewport: { width: 390, height: 844 } } }],
  testDir: './e2e', use: { baseURL: 'http://127.0.0.1:4200', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
  webServer: { command: 'npm start -- --host 127.0.0.1 --port 4200', url: 'http://127.0.0.1:4200', reuseExistingServer: true },
});
