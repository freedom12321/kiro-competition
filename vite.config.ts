import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
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
  },
  server: {
    port: 3000,
    open: '/#/'
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          'vendor': ['three', 'cannon-es', 'gsap'],
          'engine': [
            './src/engine/GameRenderer.ts',
            './src/engine/InputManager.ts',
            './src/engine/PerformanceOptimizer.ts'
          ],
          'simulation': [
            './src/simulation/DeviceInteractionSimulator.ts',
            './src/simulation/AIDeviceBehavior.ts',
            './src/simulation/EmergentStorySystem.ts'
          ],
          'ui': [
            './src/ui/GameHUD.ts',
            './src/ui/DeviceCreationPanel.ts',
            './src/ui/RoomDesigner.ts'
          ]
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['three', 'cannon-es', 'gsap']
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
})
