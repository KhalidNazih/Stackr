import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:        '#1F2D5A',
          'navy-dark': '#162043',
          'navy-light':'#2D3F73',
          teal:        '#00B894',
          'teal-dark': '#009975',
          'teal-light':'#E6F8F4',
          indigo:      '#6366F1',
          violet:      '#8B5CF6',
          coral:       '#FB7185',
          amber:       '#F59E0B',
          cyan:        '#06B6D4',
          lime:        '#84CC16',
          pink:        '#EC4899',
        },
        // Light mode neutrals
        gray: {
          25:  '#FCFCFD',  50:  '#F9FAFB',  100: '#F2F4F7',  200: '#EAECF0',
          300: '#D0D5DD',  400: '#98A2B3',  500: '#667085',  600: '#475467',
          700: '#344054',  800: '#1D2939',  900: '#101828',  950: '#0C111D',
        },
        // Dark mode neutrals — slate
        slate: {
          50:  '#F8FAFC',  100: '#F1F5F9',  200: '#E2E8F0',  300: '#CBD5E1',
          400: '#94A3B8',  500: '#64748B',  600: '#475569',  700: '#334155',
          800: '#1E293B',  900: '#0F172A',  950: '#020617',
        },
        // Custom dark surfaces
        dark: {
          0:  '#06080F', // sidebar / deepest
          50: '#0A0E1A', // page
          100:'#0F1424', // header
          200:'#151A2D', // card
          300:'#1C2238', // elevated card
          400:'#252B45', // hover
          border:    '#1E2438',
          'border-2':'#2A3251',
        },
        success: { 25: '#F6FEF9', 50: '#ECFDF3', 100: '#DCFAE6', 200: '#ABEFC6', 500: '#17B26A', 600: '#079455', 700: '#067647' },
        warning: { 25: '#FFFCF5', 50: '#FFFAEB', 100: '#FEF0C7', 200: '#FEDF89', 500: '#F79009', 600: '#DC6803', 700: '#B54708' },
        error:   { 25: '#FFFBFA', 50: '#FEF3F2', 100: '#FEE4E2', 200: '#FECDCA', 500: '#F04438', 600: '#D92D20', 700: '#B42318' },
        info:    { 25: '#F5FBFF', 50: '#EFF8FF', 100: '#D1E9FF', 200: '#B2DDFF', 500: '#2E90FA', 600: '#1570EF', 700: '#175CD3' },
        purple:  { 50: '#F4F3FF', 100: '#EBE9FE', 200: '#D9D6FE', 500: '#7A5AF8', 600: '#6938EF', 700: '#5925DC' },
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        brand: ['var(--font-brand)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs':  ['0.6875rem', { lineHeight: '1rem',    letterSpacing: '0.02em' }],
        xs:     ['0.75rem',   { lineHeight: '1.125rem' }],
        sm:     ['0.875rem',  { lineHeight: '1.25rem'  }],
        base:   ['0.9375rem', { lineHeight: '1.5rem'   }],
        lg:     ['1.0625rem', { lineHeight: '1.625rem' }],
        xl:     ['1.25rem',   { lineHeight: '1.75rem',  letterSpacing: '-0.01em' }],
        '2xl':  ['1.5rem',    { lineHeight: '2rem',     letterSpacing: '-0.02em' }],
        '3xl':  ['1.875rem',  { lineHeight: '2.25rem',  letterSpacing: '-0.025em' }],
        '4xl':  ['2.25rem',   { lineHeight: '2.75rem',  letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        xs:   '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        sm:   '0 1px 3px 0 rgba(16, 24, 40, 0.10), 0 1px 2px -1px rgba(16, 24, 40, 0.06)',
        md:   '0 4px 8px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        lg:   '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)',
        xl:   '0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)',
        '2xl':'0 24px 48px -12px rgba(16, 24, 40, 0.18)',
        glow: '0 0 24px 0 rgba(0, 184, 148, 0.3)',
        'dark-card': '0 1px 3px 0 rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'brand-hero':     'linear-gradient(135deg, #1F2D5A 0%, #2D3F73 30%, #6366F1 70%, #00B894 100%)',
        'brand-hero-dark':'linear-gradient(135deg, #0F1424 0%, #1F2D5A 30%, #4338CA 70%, #00B894 100%)',
        'card-gradient':  'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(0,184,148,0.05))',
        'mesh-light':     'radial-gradient(at 0% 0%, rgba(99,102,241,0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,184,148,0.08) 0px, transparent 50%)',
        'mesh-dark':      'radial-gradient(at 0% 0%, rgba(99,102,241,0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,184,148,0.15) 0px, transparent 50%)',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        gradient:{ '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      animation: {
        'fade-up':   'fadeUp 0.28s ease-out both',
        'fade-in':   'fadeIn 0.22s ease-out both',
        shimmer:     'shimmer 2s linear infinite',
        gradient:    'gradient 6s ease infinite',
      },
    },
  },
  plugins: [],
}

export default config
