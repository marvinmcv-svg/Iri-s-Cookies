import { defineConfig, devices } from '@playwright/test'

// Every device runs on Chromium (the browser available in CI / this container);
// device descriptors still give each project its real viewport, DPR, touch and UA.
const chromium = (d) => ({ ...d, browserName: 'chromium', defaultBrowserType: 'chromium' })

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'laptop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
    { name: 'ipad-portrait', use: chromium(devices['iPad (gen 7)']) },
    { name: 'ipad-landscape', use: chromium(devices['iPad Pro 11 landscape']) },
    { name: 'iphone-13', use: chromium(devices['iPhone 13']) },
    { name: 'iphone-se', use: chromium(devices['iPhone SE']) },
    { name: 'pixel-7', use: chromium(devices['Pixel 7']) },
  ],
})
