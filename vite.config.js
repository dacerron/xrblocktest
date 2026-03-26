import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages hosts the site under: https://dacerron.github.io/xrblocktest/
  // Using `base` ensures generated asset URLs include `/xrblocktest/`.
  base: '/xrblocktest/',
  plugins: [react()],
})
