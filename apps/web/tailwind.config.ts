// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: { DEFAULT: '#0f766e', dark: '#065f46', light: '#14b8a6' },
        gold: '#b45309',
        parchment: '#faf7f2',
      },
      fontFamily: {
        bn: ['"Noto Sans Bengali"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;