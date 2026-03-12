import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Définir le dossier racine explicitement
  root: path.resolve(__dirname, '.'),
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Dossier de sortie
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  }
})
// aloooooo 