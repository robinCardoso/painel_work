import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: './', // <-- garante caminhos relativos no build
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets', // <-- configura pasta de assets
  },
  resolve: {
    alias: {
      '@images': resolve(__dirname, 'src/assets/images'), // <-- alias para imagens
      '@assets': resolve(__dirname, 'src/assets'), // <-- novo alias para suportar imports @assets/...
    },
  },
});
