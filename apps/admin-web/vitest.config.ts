import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
