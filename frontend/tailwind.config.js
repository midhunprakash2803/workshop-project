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
        // Warm amber — primary brand accent
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Natural stone palette — surfaces, text, borders
        stone: {
          50:  '#faf9f7',
          75:  '#f4f2ee',
          100: '#f5f5f4',
          150: '#ede9e3',
          200: '#e7e5e4',
          250: '#e2ddd6',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Success green
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        // Danger red
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Info blue
        info: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'soft':    '0 1px 3px rgba(28,25,23,0.06), 0 4px 16px rgba(28,25,23,0.04)',
        'card':    '0 2px 8px rgba(28,25,23,0.07), 0 8px 24px rgba(28,25,23,0.05)',
        'lifted':  '0 4px 12px rgba(28,25,23,0.10), 0 16px 40px rgba(28,25,23,0.08)',
        'amber':   '0 2px 8px rgba(180,83,9,0.20), 0 6px 20px rgba(180,83,9,0.12)',
      },
      animation: {
        'fade-in':      'fadeIn 0.18s ease-out',
        'slide-down':   'slideDown 0.2s ease-out',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
