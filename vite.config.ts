import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('/three/')) {
              return 'vendor-three';
            }
            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (id.includes('/qrcode/')) {
              return 'vendor-qrcode';
            }
            if (id.includes('/canvas-confetti/')) {
              return 'vendor-confetti';
            }
            return 'vendor';
          }
          if (id.includes('/src/data/bouquets')) {
            return 'catalog-data';
          }
        },
      },
    },
  },
})
