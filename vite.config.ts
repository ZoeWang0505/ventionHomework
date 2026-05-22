import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // pouchdb-browser is authored against Node built-ins (`events`, `inherits`,
    // `global`). Vite externalizes those in browser builds, which makes
    // pouchdb-browser crash at module init. Polyfill them here so the browser
    // bundle resolves to real implementations.
    nodePolyfills({
      globals: { global: true, process: true, Buffer: true },
    }),
  ],
  css: {
    modules: {
      scopeBehaviour: 'local',
      localsConvention: 'camelCaseOnly'
    }
  }
})
