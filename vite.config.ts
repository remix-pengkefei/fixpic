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
})
