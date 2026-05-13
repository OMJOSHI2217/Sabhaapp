import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Enforces HTTPS so mobile browsers grant webcam access
  ],
  server: {
    host: true // Exposes Vite automatically to the LAN network
  }
})
