import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /<repo-name>/ — keep in sync with the repo name
  base: process.env.GITHUB_PAGES ? '/GHA-School_Managment_System/' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
