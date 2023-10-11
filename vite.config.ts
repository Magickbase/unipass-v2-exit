import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import inject from '@rollup/plugin-inject';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    build:
      mode === 'production'
        ? {
            rollupOptions: {
              plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
            },
          }
        : undefined,

    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        plugins:
          mode === 'development'
            ? [NodeGlobalsPolyfillPlugin({ buffer: true, process: true })]
            : undefined,
      },
    },
  };
});
