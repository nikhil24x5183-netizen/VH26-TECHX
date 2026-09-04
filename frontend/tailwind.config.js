/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          accent: '#f59e0b', // Industrial Amber
          accentHover: '#d97706',
          highlight: '#38bdf8', // Cyan highlight
          success: '#10b981',
          warning: '#f43f5e',
        }
      }
    },
  },
  plugins: [],
}
