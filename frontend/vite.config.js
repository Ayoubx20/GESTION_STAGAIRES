import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'  // ✅ AJOUTEZ CETTE LIGNE !!!

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')  // ✅ path est maintenant défini
      }
    }
  }
})