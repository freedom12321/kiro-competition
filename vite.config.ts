import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/engine': resolve(__dirname, 'src/engine'),
      '@/ui': resolve(__dirname, 'src/ui'),
      '@/simulation': resolve(__dirname, 'src/simulation')
    }
  },
  server: {
    port: 3000,
    open: true
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