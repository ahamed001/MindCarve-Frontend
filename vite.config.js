import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API is proxied so the HttpOnly session cookie is same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:4500', changeOrigin: true } },
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
});
