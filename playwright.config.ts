import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      grep: /@cross-browser/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-portrait',
      grep: /@responsive/,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'short-viewport',
      grep: /@responsive/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 520 } },
    },
    {
      name: 'mobile-landscape',
      grep: /@responsive/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 844, height: 390 } },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
