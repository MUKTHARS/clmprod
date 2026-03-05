// /home/ubuntu/clmprod/frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      '/api': {
        target: 'https://grantapi.saple.ai',
        changeOrigin: true,
        secure: false
      }
    }
  }
})