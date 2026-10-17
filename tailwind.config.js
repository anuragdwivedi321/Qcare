/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#F8FAFC',
          surface: '#FFFFFF',
          subtle: '#F1F5F9',
          deep: '#E2E8F0',
          dark: '#0F172A',
        },
        ink: {
          DEFAULT: '#0F172A',
          soft: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          DEFAULT: '#0D9488',
          deep: '#115E59',
        },
        electric: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
          600: '#0284C7',
          DEFAULT: '#0284C7',
        },
        amber: {
          soft: '#FEF3C7',
          DEFAULT: '#F59E0B',
          deep: '#B45309',
        },
        rose: {
          soft: '#FFE4E6',
          DEFAULT: '#F43F5E',
          deep: '#BE123C',
        },
        emerald: {
          soft: '#DCFCE7',
          DEFAULT: '#10B981',
          deep: '#047857',
        },
        hairline: {
          DEFAULT: '#E2E8F0',
          soft: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'paper-xs': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'paper-sm': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'paper': '0 4px 14px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'paper-lg': '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
        'paper-xl': '0 20px 35px -5px rgba(15, 23, 42, 0.1), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
        'glow-brand': '0 0 20px rgba(13, 148, 136, 0.25)',
        'glow-electric': '0 0 20px rgba(2, 132, 199, 0.25)',
      },
      borderRadius: {
        'card': '16px',
        'modal': '20px',
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}
