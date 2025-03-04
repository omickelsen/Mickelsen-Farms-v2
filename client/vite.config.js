import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    host: 'localhost',
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        onProxyReq: (proxyReq, req) => {
          console.log(`Proxying request: ${req.url} to ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req) => {
          console.log(`Proxy response: ${proxyRes.statusCode} for ${req.url}`);
        },
      },
    },
  },
  plugins: [react()],
  clearScreen: false,
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});