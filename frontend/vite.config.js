/**
 * Vite Configuration
 * 
 * Build configuration for React frontend application.
 * Configures dev server, plugins, and environment variable injection.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Enable React plugin for JSX transformation and Fast Refresh
  plugins: [react()],

  // Development server configuration
  server: {
    host: '0.0.0.0',  // Allow external connections (required for Docker)
    port: 3000         // Frontend port
  },

  // Define global constants available in the application
  define: {
    // Inject API URL as a global constant
    __API__: JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:5000/api')
  }
})
