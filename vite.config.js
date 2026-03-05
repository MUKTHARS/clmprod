// /home/ubuntu/clmprod/frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, './frontend', '')
  const backendUrl = env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4001'

  return {
    plugins: [react()],
    server: {
      port: 4000,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})