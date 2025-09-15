/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Higher threshold for core simulation logic
        'src/policies/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/sim/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    // Enable deterministic testing with seeded random values
    seed: 12345,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/app': resolve(__dirname, 'src/app'),
      '@/ui': resolve(__dirname, 'src/ui'),
      '@/view': resolve(__dirname, 'src/view'),
      '@/sim': resolve(__dirname, 'src/sim'),
      '@/agents': resolve(__dirname, 'src/agents'),
      '@/policies': resolve(__dirname, 'src/policies'),
      '@/scenarios': resolve(__dirname, 'src/scenarios'),
      '@/types': resolve(__dirname, 'src/types')
    }
  }
})