import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API is proxied so the HttpOnly session cookie is same-origin.
// VITE_API_PROXY (in .env) points the proxy at another backend, e.g. the deployed one on Render.
export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, process.cwd(), '').VITE_API_PROXY || 'http://localhost:4500';
  return {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target, changeOrigin: true },
      // Live updates (Socket.IO) go to the same API server, over WebSocket.
      '/socket.io': { target, changeOrigin: true, ws: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
          charts: ['recharts'],
          forms: ['formik', 'yup'],
        },
      },
    },
  },
  };
});
