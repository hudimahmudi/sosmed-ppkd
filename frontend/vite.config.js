// File ini: pengaturan Vite + plugin React + Tailwind
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Semua request /api dan /uploads diteruskan ke backend Express (port 5000)
    // Jadi browser menganggap frontend & backend satu alamat -> cookie sesi aman & mudah
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
