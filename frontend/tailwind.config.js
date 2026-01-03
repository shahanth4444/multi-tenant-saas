/**
 * Tailwind CSS Configuration
 * 
 * Defines custom theme extensions and content paths for Tailwind CSS.
 * Includes custom brand colors for consistent UI styling.
 * 
 * @type {import('tailwindcss').Config}
 */
export default {
  // Content paths for Tailwind to scan for class names
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  // Theme customization
  theme: {
    extend: {
      // Custom brand colors
      colors: {
        brand: {
          DEFAULT: '#2563eb',  // Primary brand blue
          dark: '#1e40af',      // Darker shade for hover states
          light: '#60a5fa'      // Lighter shade for backgrounds
        }
      }
    },
  },

  plugins: [],
}
