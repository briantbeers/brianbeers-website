/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#171717',
          soft: '#404040',
        },
        accent: {
          DEFAULT: '#FBA91A',
          hover: '#FBBD23',
        },
        mint: '#D9FE89',
        border: '#E8E4DC',
        // James Clear–style warmer creams
        cream: {
          DEFAULT: '#f9f8f4', // hero / nav cream
          soft: '#f9f8f4',
          deep: '#E8E0D2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
