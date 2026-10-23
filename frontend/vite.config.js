import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/patients': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/departments': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/queue': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/tokens': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
