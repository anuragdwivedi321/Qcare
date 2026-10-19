/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand: Midnight Obsidian
        obsidian: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#0B192C',
          DEFAULT: '#0F172A',
        },
        // Signature Accent: Luminescent Alpine Teal
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
          DEFAULT: '#0D9488',
        },
        // Warm Human Touch: Soft Warm Amber
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          soft: '#FEF3C7',
          DEFAULT: '#F59E0B',
          deep: '#B45309',
        },
        // Emergency / Urgent Triage (Strict Isolation): Vivid Coral Red
        coral: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          DEFAULT: '#EF4444',
          surface: '#FEF2F2',
        },
        bg: {
          DEFAULT: '#F8FAFC',
          surface: '#FFFFFF',
          subtle: '#F1F5F9',
          deep: '#E2E8F0',
          dark: '#0B192C',
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
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#0F172A',
          DEFAULT: '#0D9488',
          deep: '#0F172A',
        },
        hairline: {
          DEFAULT: 'rgba(148, 163, 184, 0.2)',
          soft: 'rgba(148, 163, 184, 0.12)',
          dark: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Comfortaa', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Comfortaa', 'sans-serif'],
        mono: ['Plus Jakarta Sans', 'Inter', 'monospace'],
      },
      boxShadow: {
        'diffused': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 10px 25px -5px rgba(15, 23, 42, 0.06)',
        'clinical': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 10px 25px -5px rgba(15, 23, 42, 0.06)',
        'popover': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 20px 30px -10px rgba(15, 23, 42, 0.12)',
        'teal-glow': '0 0 20px -3px rgba(13, 148, 136, 0.35)',
        'paper-xs': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'paper-sm': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'paper': '0 4px 14px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'paper-lg': '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
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
