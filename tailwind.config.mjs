/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#000000',
          text: '#00ff41',
          dim: '#008f11',
          bright: '#39ff14'
        }
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace']
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        typewriter: 'typewriter 0.5s steps(40) 1s forwards'
      },
      keyframes: {
        blink: {
          'from, to': { opacity: '1' },
          '50%': { opacity: '0' }
        },
        typewriter: {
          to: { width: '100%' }
        }
      }
    }
  },
  plugins: []
};
