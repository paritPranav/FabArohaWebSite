// apps/client/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Earthy Pastel Brand Palette ──────────────────
        cream:     { DEFAULT: '#F5F0E8', 50: '#FDFBF7', 100: '#F5F0E8', 200: '#EDE4D2', 300: '#E0D4BC' },
        sage:      { DEFAULT: '#8FAF89', 50: '#EEF4ED', 100: '#D4E5D2', 200: '#B4CEB1', 300: '#8FAF89', 400: '#6D9467', 500: '#537A4E' },
        sand:      { DEFAULT: '#C8A97E', 50: '#F7EFE3', 100: '#EDDDC6', 200: '#DEC9A4', 300: '#C8A97E', 400: '#B08B58', 500: '#8A6D42' },
        blush:     { DEFAULT: '#D4A5A5', 50: '#F7EDED', 100: '#EDD7D7', 200: '#E0BEBE', 300: '#D4A5A5', 400: '#BF8484', 500: '#A66262' },
        clay:      { DEFAULT: '#9E7B65', 50: '#F0E9E4', 100: '#DDD0C8', 200: '#C2AA9C', 300: '#A68872', 400: '#9E7B65', 500: '#7D5F4C' },
        moss:      { DEFAULT: '#6B7C5C', 50: '#EBF0E6', 100: '#CFDAC6', 200: '#AABB9C', 300: '#849A72', 400: '#6B7C5C', 500: '#526047' },
        stone:     { DEFAULT: '#8C8378', 50: '#F2F0EE', 100: '#E0DDD8', 200: '#C5C1BA', 300: '#A8A29A', 400: '#8C8378', 500: '#6D6760' },
        parchment: '#FAF7F2',
        bark:      '#5C4A3A',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft':  '0 2px 20px rgba(92,74,58,0.08)',
        'card':  '0 4px 32px rgba(92,74,58,0.10)',
        'hover': '0 8px 40px rgba(92,74,58,0.15)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease forwards',
        'slide-up':   'slideUp 0.5s ease forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
