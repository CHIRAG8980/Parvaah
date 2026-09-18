import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F4F8FC',
        card: '#FFFFFF',
        border: {
          DEFAULT: '#DCE6F2',
          subtle: '#E8F0F8',
        },
        navy: {
          950: '#0A172E',
          900: '#0F2346',
          800: '#163B70',
          700: '#1E4E94',
        },
        text: {
          primary: '#0F1F3D',
          secondary: '#536B8F',
          muted: '#8497B0',
        },
        brand: {
          50: '#EAF3FF',
          100: '#D5E6FE',
          200: '#ACCEFC',
          500: '#1769D2',
          600: '#1257B2',
          700: '#0F448C',
        },
        risk: {
          low: '#10B981',
          'low-bg': '#ECFDF5',
          'low-border': '#A7F3D0',
          medium: '#F59E0B',
          'medium-bg': '#FFFBEB',
          'medium-border': '#FDE68A',
          high: '#F97316',
          'high-bg': '#FFF7ED',
          'high-border': '#FED7AA',
          critical: '#EF4444',
          'critical-bg': '#FEF2F2',
          'critical-border': '#FECACA',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
          'info-border': '#BFDBFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15, 35, 70, 0.05), 0 1px 2px rgba(15, 35, 70, 0.03)',
        'card-hover': '0 4px 12px rgba(15, 35, 70, 0.08), 0 2px 4px rgba(15, 35, 70, 0.04)',
        'overlay': '0 8px 24px rgba(15, 35, 70, 0.12)',
      },
      borderRadius: {
        'card': '12px',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
        '250': '250ms',
        '280': '280ms',
        '350': '350ms',
      },
      keyframes: {
        'dropdown-enter': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'modal-enter': {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'page-enter': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'error-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '50%': { transform: 'translateX(2px)' },
          '75%': { transform: 'translateX(-1px)' },
        },
        'subtle-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.82', transform: 'scale(1.04)' },
        },
      },
      animation: {
        'dropdown': 'dropdown-enter 190ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'modal': 'modal-enter 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'page': 'page-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'error-shake': 'error-shake 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        'subtle-pulse': 'subtle-pulse 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
