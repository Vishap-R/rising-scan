import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// On enlève l'import de tailwind temporairement pour que npx puisse se lancer
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  }
});