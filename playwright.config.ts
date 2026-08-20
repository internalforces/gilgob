import { defineConfig } from '@playwright/test';
import { SITE_CONFIG } from './src/config/site';

const previewBaseUrl = `http://127.0.0.1:4321${SITE_CONFIG.base}/`;

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: previewBaseUrl,
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: previewBaseUrl,
    reuseExistingServer: !process.env.CI,
  },
});
