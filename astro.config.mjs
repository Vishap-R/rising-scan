import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel'; // On importe l'adaptateur

export default defineConfig({
  // 'hybrid' permet de garder le site ultra rapide (statique) 
  // tout en autorisant des fonctions serveur pour l'API.
  output: 'hybrid', 
  adapter: vercel(), 
  vite: {
    plugins: [tailwindcss()],
  },
});
