import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  base: '/astroslop.github.io/',
  build: {
    target: 'esnext',
  },
});
