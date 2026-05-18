import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ui',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5194',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 5194,
    reuseExistingServer: true,
  },
})