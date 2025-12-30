import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 3000 },
  define: {
    __API__: JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:5000/api')
  }
})
