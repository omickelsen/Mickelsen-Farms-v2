import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path'; // Import resolve for alias (optional)

export default defineConfig({
  server: {
    port: 3000, // Set the development server to run on port 3000
    host: 'localhost', // Optionally specify the host
    open: true, // Automatically open browser
  },
  plugins: [react()],
  clearScreen: false, // Keep terminal output visible
  css: {
    postcss: './postcss.config.js', // Specify the PostCSS configuration file
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // Optional alias for src directory
    },
  },
});