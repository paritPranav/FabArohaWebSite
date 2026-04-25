import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#F5F0E8', 100: '#F5F0E8', 200: '#EDE4D2', 300: '#E0D4BC' },
        sage:  { DEFAULT: '#8FAF89', 50: '#EEF4ED' },
        sand:  { DEFAULT: '#C8A97E', 50: '#F7EFE3' },
        blush: { DEFAULT: '#D4A5A5', 50: '#F7EDED' },
        bark:  '#5C4A3A',
        parchment: '#FAF7F2',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
