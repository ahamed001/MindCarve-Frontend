/** @type {import('tailwindcss').Config} */
// Palette taken from the existing Athma deployment (CSS variables --orange, --navy, --ink, --muted ...).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFF9F5',
        line: '#F1E7DF',
        field: '#F8FAFC',
        ink: { DEFAULT: '#1E293B', soft: '#334155' },
        muted: '#64748B',
        navy: { DEFAULT: '#1E3A6D', 2: '#27487F' },
        brand: { 50: '#FFF4EE', 100: '#FDE4D8', 200: '#F9C6AC', 500: '#E8571F', 600: '#D24A14', 700: '#A93A0F' },
        risk: { low: '#16A34A', moderate: '#F97316', high: '#DC2626', none: '#A8A29A', pending: '#7C8AA5' },
        chart: { bar: '#CBD5E1', low: '#FDBA74', moderate: '#F97316', high: '#9A3412' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(30,41,59,0.03), 0 4px 14px rgba(30,41,59,0.03)' },
      borderRadius: { card: '18px' },
    },
  },
  plugins: [],
};
