import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@liyalabs/liya-3d-avatar-widget-react': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
});
