/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#0a0b0e',
          900: '#111318',
          850: '#161920',
          800: '#1c2029',
          700: '#282e3b',
          600: '#3b4354',
          500: '#525d73',
          400: '#7e8ba3',
          300: '#a6b2c9',
          200: '#d0d7e6',
          100: '#eef2f9',
        },
        brand: {
          500: '#6366f1', // Indigo / violet accent
          600: '#4f46e5',
          700: '#4338ca',
        }
      },
    },
  },
  plugins: [],
}
