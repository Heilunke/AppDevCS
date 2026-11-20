import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Relative paths so the built files load correctly inside the Cordova www folder
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 }
})
