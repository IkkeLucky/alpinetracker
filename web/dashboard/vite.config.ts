import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel rejects env var names starting with VITE_ in its dashboard, so
  // client-exposed vars use PUBLIC_ instead of Vite's default prefix.
  envPrefix: 'PUBLIC_',
})
