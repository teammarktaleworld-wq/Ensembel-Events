import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// On Vercel the share image and og:url point at the deployment itself; otherwise the live domain.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: vercel ? `https://${vercel}` : 'https://www.ensembelevents.com',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
});
