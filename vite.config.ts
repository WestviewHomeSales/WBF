import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const timestamp = new Date().getTime();

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(timestamp),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
