import { defineConfig, devices } from '@playwright/test';
import { createRequire } from 'node:module';
import { CONSOLE_URL } from './config';

// ESM-safe require — package.json is "type": "module", so bare require is undefined.
const require = createRequire(import.meta.url);

export default defineConfig({
  testDir: './e2e',
  // The app already runs in compose; globalSetup gates on its real readiness.
  globalSetup: './e2e/global-setup.ts',
  // Cold-sandbox-friendly timeouts; tighten once the stack is warm.
  timeout: 600_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['@heal-dev/heal-playwright-tracer/reporter']],

  // Heal tracer: instrument ONLY the spec dir (never app code / node_modules).
  ...({
    '@playwright/test': {
      babelPlugins: [
        [
          require.resolve('@heal-dev/heal-playwright-tracer/code-hook-injector'),
          { include: [/\/e2e\//] },
        ],
      ],
    },
  } as any),

  use: {
    baseURL: process.env.SANDBOX_BASE_URL ?? CONSOLE_URL,
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
    trace: 'on',
    video: 'on',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
  },

  projects: [
    // No auth in the local stack → no setup project. One browser project.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
