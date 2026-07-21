import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiProxyTarget = process.env.PAIRDOCK_DEV_API_PROXY_TARGET ?? 'http://127.0.0.1:3000';
const apiProxy = { target: apiProxyTarget };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': apiProxy,
      '/health': apiProxy,
      '/projects': apiProxy,
      '/sessions': apiProxy,
      '/socket.io': { ...apiProxy, ws: true },
      '/tool-readiness': apiProxy,
    },
  },
});
