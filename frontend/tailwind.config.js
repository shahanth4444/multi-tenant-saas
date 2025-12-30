/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1e40af',
          light: '#60a5fa'
        }
      }
    },
  },
  plugins: [],
}
