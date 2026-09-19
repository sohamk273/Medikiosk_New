import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetBackend = env.VITE_API_BASE_URL || env.VITE_BACKEND_URL || 'http://localhost:8010';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: targetBackend,
          changeOrigin: true,
        },
      },
    },
  };
});
