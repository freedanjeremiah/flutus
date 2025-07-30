import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import wasm from 'vite-plugin-wasm';  // For WASM ESM support

export default defineConfig({
  plugins: [
    legacy({ targets: ['defaults'] }),
    wasm()  // Handles WASM loading
  ],
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
      'data:text/javascript,export default class Module {}': './empty-module.js'
    }
  },
  optimizeDeps: {
    include: ['@emurgo/cardano-serialization-lib-browser'],  // Pre-bundle serialization lib
    esbuildOptions: { target: 'es2022' }  // For top-level await
  },
  worker: {
    format: 'es'
  },
  server: {
    open: true,
    hmr: { overlay: false }  // Hide overlays during testing
  }
});
