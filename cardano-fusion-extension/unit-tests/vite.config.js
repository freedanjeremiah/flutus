import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [legacy({ targets: ['defaults'] })],
  resolve: {
    alias: {
      'assert': 'assert',
      'crypto': 'crypto-browserify',
      'events': 'events',
      'http': 'stream-http',
      'https': 'https-browserify',
      'path': 'path-browserify',
      'stream': 'stream-browserify',
      'url': 'url',
      'zlib': 'browserify-zlib',
      'data:text/javascript,export default class Module {}': './empty-module.js'  // Absolute path to avoid warning
    }
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' }  // Updated to support top-level await
  },
  server: {
    open: true  // Auto-open browser
  }
});
