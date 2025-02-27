import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000, // Set the development server to run on port 3000
    host: 'localhost', // Optionally specify the host
    open: true, // Automatically open browser
  },
  plugins: [react()],
  clearScreen: false, // Keep terminal output visible
});
