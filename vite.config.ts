import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync } from 'fs'
import { join } from 'path'

// Plugin to copy content folder to dist
function copyContentPlugin() {
  return {
    name: 'copy-content',
    closeBundle() {
      const srcContent = join(process.cwd(), 'content')
      const destContent = join(process.cwd(), 'dist', 'content')

      if (existsSync(srcContent)) {
        cpSync(srcContent, destContent, { recursive: true })
        console.log('✓ Copied content folder to dist')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyContentPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 把 Sentry 单独打包，延迟加载
          'sentry': ['@sentry/react'],
          // React 相关
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // i18n 相关
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        }
      }
    }
  }
})
