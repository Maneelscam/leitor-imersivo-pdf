/// <reference types="vitest/config" />

import {
  fileURLToPath,
  URL,
} from 'node:url'

import react from '@vitejs/plugin-react'
import {
  defineConfig,
} from 'vite'

export default defineConfig({
  base: '/leitor-imersivo-pdf/',

  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(
        new URL(
          './src',
          import.meta.url,
        ),
      ),
    },
  },

  test: {
    environment: 'node',

    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],

    setupFiles: [
      './src/test/setup.ts',
    ],

    clearMocks: true,
    restoreMocks: true,
  },

  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },

  preview: {
    host: '127.0.0.1',
    port: 4173,
  },

  build: {
    target: 'es2022',
    sourcemap: false,
    reportCompressedSize: true,
  },
})