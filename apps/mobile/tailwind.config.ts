import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          dark: '#0F6E56',
        },
        bg: {
          primary: '#0f0f0f',
          secondary: '#1a1a1a',
          tertiary: '#252525',
        },
        txt: {
          primary: '#f5f5f5',
          secondary: '#a3a3a3',
          tertiary: '#737373',
          danger: '#f87171',
        },
        bdr: {
          primary: 'rgba(255,255,255,0.12)',
          secondary: 'rgba(255,255,255,0.08)',
          tertiary: 'rgba(255,255,255,0.06)',
        },
      },
    },
  },
} satisfies Config
