import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

import { terser } from 'rollup-plugin-terser'
import compressPlugin from 'vite-plugin-compression'


export default defineConfig({
  plugins: [
    vue({
      script: {
        refSugar: true
      }
    }),
    terser(),
    compressPlugin({
      ext: '.gz',
      algorithm: 'gzip',
      deleteOriginFile: false
    })
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    assetsDir: ''
  },
  server: {
    host: '0.0.0.0',
    open: true
  }
})
