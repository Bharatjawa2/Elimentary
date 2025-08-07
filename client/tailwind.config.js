/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for FinanceAI
        'finance-blue': '#3B82F6',
        'finance-green': '#10B981',
        'finance-purple': '#8B5CF6',
        'finance-orange': '#F59E0B',
        'finance-red': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
