import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression()
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            return 'modules';
          }
        }
      }
    }
  },
  server: {
    proxy: {
      // Forward /api/* to Flask backend (Gemini AI stream, etc.)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Forward /predict and /health to Flask backend (skin model)
      '/predict': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/classes': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})

