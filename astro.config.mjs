import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // On retire la ligne "output: 'hybrid'" car elle fait planter Astro 5
  adapter: vercel(), 
  vite: {
    plugins: [tailwindcss()],
  },
});
