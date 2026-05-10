import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
        about: resolve(__dirname, 'src/about/index.html'),
        projects: resolve(__dirname, 'src/projects/index.html'),
        writing: resolve(__dirname, 'src/writing/index.html'),
        contact: resolve(__dirname, 'src/contact/index.html')
      }
    }
  }
})