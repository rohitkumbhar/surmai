import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @ts-expect-error whatever
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    root: path.join(__dirname, 'site'),
    build: {
      outDir: path.join(__dirname, 'docs'),
    },
    plugins: [react()],
  };
});
