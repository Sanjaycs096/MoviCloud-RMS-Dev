import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const USER_SRC  = path.resolve(__dirname, './src')
const ADMIN_SRC = path.resolve(__dirname, '../Admin_side/frontend/src')

const EXTS = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js']

function resolveWithExts(base: string, rel: string): string | undefined {
  const full = path.resolve(base, rel)
  for (const ext of EXTS) {
    if (fs.existsSync(full + ext)) return full + ext
  }
  if (fs.existsSync(full)) return full
  return undefined
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: [
      // @admin/* → Admin_side/frontend/src/* (explicit prefix, checked first)
      { find: '@admin', replacement: ADMIN_SRC },
      // @/* — context-aware: resolve to Admin src when importer is inside Admin_side,
      //        otherwise resolve to User src.
      {
        find: /^@\//,
        replacement: '',
        customResolver(source: string, importer: string | undefined) {
          // Vite already stripped @/ via the regex replacement, so source = "app/App" etc.
          const imp  = (importer ?? '').replace(/\\/g, '/')
          const base = imp.includes('Admin_side') ? ADMIN_SRC : USER_SRC
          return resolveWithExts(base, source) ?? null
        },
      },
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      },
    },
  },
})
