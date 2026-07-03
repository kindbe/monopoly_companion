import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: "http://127.0.0.1:5175",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "PORT=8788 pnpm dev:server",
      port: 8788,
      reuseExistingServer: false
    },
    {
      command:
        "VITE_WS_URL=ws://127.0.0.1:8788 VITE_MULTIPLAYER_TRANSPORT=webrtc VITE_E2E_COUNTDOWN_SECONDS=5 pnpm exec vite --host 127.0.0.1 --port 5175",
      url: "http://127.0.0.1:5175",
      reuseExistingServer: false
    }
  ]
})
