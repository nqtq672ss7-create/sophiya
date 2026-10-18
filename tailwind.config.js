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
        // Утвержденная клиентская палитра «София»
        sofiya: {
          'black-purple': '#1E0708',
          'red-berry': '#6C1E26',
          'matrix': '#884B43',
          'viola': '#C18F96',
          'petal': '#F1E1E9',
        },
        // Служебные оттенки
        brand: {
          dark: '#140506',
          surface: '#1E0708',
          card: '#280c10',
          border: 'rgba(193, 143, 150, 0.22)',
          'border-strong': 'rgba(193, 143, 150, 0.45)',
          gold: '#d4af37',
          champagne: '#f4e3c7',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
      animation: {
        'spin-slow': 'spin 30s linear infinite',
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 7s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
