import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { setupApiMiddleware } from './src/server/middleware';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use(setupApiMiddleware(server));
      },
    },
  ],
});
