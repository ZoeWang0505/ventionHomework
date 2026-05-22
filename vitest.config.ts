import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // pouchdb-browser's `immediate` dep references Node's `global` — alias to
  // `globalThis` so the browser test env resolves it.
  define: {
    global: 'globalThis',
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }]
    }
  }
})
