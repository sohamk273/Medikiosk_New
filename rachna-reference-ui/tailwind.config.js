/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mediblue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          DEFAULT: '#2563EB', // Medical Blue
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A', // Deep Blue
          950: '#0F172A', // Deep Navy
        },
        medigreen: {
          50: '#ECFDF5', // Pale Green
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Soft Green
          600: '#059669',
          700: '#047857',
        },
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        indic: ['"Noto Sans Devanagari"', '"Noto Sans Tamil"', '"Noto Sans Telugu"', '"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 58, 138, 0.08), 0 2px 8px 0 rgba(37, 99, 235, 0.04)',
        'glass-hover': '0 14px 40px 0 rgba(31, 58, 138, 0.14), 0 4px 12px 0 rgba(37, 99, 235, 0.08)',
        'glass-active': '0 4px 16px 0 rgba(31, 58, 138, 0.12)',
        'soft-neumorphic': '6px 6px 16px rgba(190, 205, 225, 0.4), -6px -6px 16px rgba(255, 255, 255, 0.8)',
        'card-selected': '0 0 0 3px #2563EB, 0 12px 30px rgba(37, 99, 235, 0.18)',
        'card-green-selected': '0 0 0 3px #10B981, 0 12px 30px rgba(16, 185, 129, 0.18)',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
    },
  },
  plugins: [],
}
