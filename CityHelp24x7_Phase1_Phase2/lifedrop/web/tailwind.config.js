/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MyCityZone brand: one red UI across the site.
        brand: {
          950: '#450A0A',
          900: '#7F1D1D',
          800: '#991B1B',
          700: '#B91C1C',
          600: '#DC2626',
          500: '#EF4444',
          400: '#F87171',
          300: '#FCA5A5',
          200: '#FECACA',
          100: '#FEE2E2',
          50: '#FFF5F5',
        },
        navy: {
          950: '#070D1A',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        primary: {
          950: '#450A0A',
          900: '#7F1D1D',
          850: '#8A1818',
          800: '#991B1B', // Dark red
          750: '#AC1E1E',
          700: '#B91C1C',
          650: '#C62828', // Material Dark Red
          600: '#DC2626', // Primary Red
          500: '#EF4444', // Accent Red
          400: '#F87171',
          300: '#FCA5A5',
          200: '#FECACA',
          100: '#FEE2E2', // Soft Pink Pill
          50: '#FFF5F5',  // Hero Background
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sos': '0 0 20px rgba(220, 38, 38, 0.45)',
        'sos-hover': '0 0 28px rgba(220, 38, 38, 0.7)',
        'card-soft': '0 2px 10px rgba(0, 0, 0, 0.04), 0 12px 30px rgba(0, 0, 0, 0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '70%': { opacity: '1', transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'ring-pulse': {
          '0%': { opacity: '0.5', transform: 'scale(0.7)' },
          '100%': { opacity: '0', transform: 'scale(2.3)' },
        },
        'intro-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1.08)', visibility: 'hidden' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'ring-pulse': 'ring-pulse 1.8s ease-out infinite',
        'intro-out': 'intro-out 0.45s ease-in 1.6s forwards',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 55%, #DC2626 100%)',
        'gradient-alert': 'linear-gradient(to right, #991B1B, #C62828)',
        'gradient-sos': 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        'gradient-hero-text': 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #EF4444 100%)',
      }
    },
  },
  plugins: [],
}
