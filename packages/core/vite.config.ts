import path from 'path'
import { defineConfig } from 'vite'
export default defineConfig({
  resolve: {
    alias: {
      'simple-peer': path.resolve(__dirname, './node_modules/simple-peer/simplepeer.min.js'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, './index.ts'),
      name: 'MagicWebrtc',
    },
  },
})
