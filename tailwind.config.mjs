/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Near-black ink (James Clear–style) — replaces navy chrome for type
        navy: {
          DEFAULT: '#171717',
          soft: '#404040',
        },
        accent: {
          DEFAULT: '#FBA91A',
          hover: '#FBBD23',
        },
        mint: '#D9FE89',
        border: '#E8E8E8',
        cream: '#FAFAF8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
