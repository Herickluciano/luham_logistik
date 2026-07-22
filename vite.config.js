import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Assure des chemins relatifs simples et universels
  build: {
    // Force Vite à sortir les fichiers directement à la racine du dossier dist
    assetsDir: '', 
    rollupOptions: {
      output: {
        // Enlève le préfixe "assets/" des fichiers JS et CSS
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      }
    }
  }
})
