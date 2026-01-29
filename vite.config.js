// /home/ubuntu/clmprod/frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      '/api': {
        target: 'http:///44.219.56.85:4001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})