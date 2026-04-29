/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'legal-blue': '#1e3a5f',
        'legal-light': '#f8fafc',
        'legal-gray': '#e2e8f0',
      },
    },
  },
  plugins: [],
}
