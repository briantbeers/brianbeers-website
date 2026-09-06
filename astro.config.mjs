import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

// Keystatic admin needs a running Node server (dev only here).
// Exclude it from `astro build` so static production builds stay clean.
const isDev = process.argv.includes('dev') || process.env.KEYSTATIC === '1';

export default defineConfig({
  integrations: [
    tailwind(),
    mdx(),
    react(),
    markdoc(),
    ...(isDev ? [keystatic()] : []),
  ],
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});
