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
          dark: '#0B0F19',
        },
        ink: {
          DEFAULT: '#0F172A',
          soft: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          DEFAULT: '#2563EB',
          deep: '#0F172A',
        },
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        electric: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          DEFAULT: '#2563EB',
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
          dark: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Comfortaa', 'sans-serif'],
        display: ['Comfortaa', 'sans-serif'],
        mono: ['Comfortaa', 'sans-serif'],
      },
      boxShadow: {
        'paper-xs': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'paper-sm': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'paper': '0 4px 14px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'paper-lg': '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
        'paper-xl': '0 20px 35px -5px rgba(15, 23, 42, 0.1), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
        'glow-brand': '0 0 24px rgba(37, 99, 235, 0.3)',
        'glow-emerald': '0 0 24px rgba(16, 185, 129, 0.3)',
        'glow-rose': '0 0 24px rgba(244, 63, 94, 0.3)',
        'glow-indigo': '0 0 24px rgba(99, 102, 241, 0.3)',
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
