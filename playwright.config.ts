import { defineConfig } from '@playwright/test';

// Runs the built app at the phone size most often seen with browser toolbars showing.
// Chromium only: real iPhone and Android checks stay on the launch checklist.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4175/graphite/', viewport: { width: 375, height: 664 }, trace: 'retain-on-failure' },
  webServer: { command: 'npx vite preview --port 4175 --strictPort', url: 'http://localhost:4175/graphite/', reuseExistingServer: true },
});
