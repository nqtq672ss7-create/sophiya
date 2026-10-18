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
        atelier: {
          950: '#050706',
          900: '#0a0e0c',
          850: '#101713',
          800: '#16201b',
          700: '#223029',
          border: 'rgba(218, 185, 115, 0.18)',
          'border-light': 'rgba(255, 255, 255, 0.08)',
        },
        gold: {
          light: '#f4e5ba',
          DEFAULT: '#d4af37',
          dim: '#9a7f28',
          metallic: '#c5a059',
          champagne: '#e9d7b4',
        },
        petal: {
          noir: '#280c13',
          velvet: '#70192a',
          bordeaux: '#942239',
          blush: '#f6d5da',
          cream: '#fcf8f2',
        },
        sage: {
          deep: '#0a1d14',
          subtle: '#2a4435',
          pale: '#7fa38c',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Italiana', 'Cormorant Garamond', 'serif'],
      },
      animation: {
        'spin-slow': 'spin 25s linear infinite',
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-gentle': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
