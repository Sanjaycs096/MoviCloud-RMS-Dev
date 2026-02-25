import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const USER_SRC  = path.resolve(__dirname, './src')
const ADMIN_SRC = path.resolve(__dirname, '../Admin_side/frontend/src')

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
          // NOTE: Vite already applied the regex replacement (@/ → '') before calling
          // customResolver, so `source` here is already the bare path e.g. "app/App"
          const imp  = (importer ?? '').replace(/\\/g, '/')
          const base = imp.includes('Admin_side') ? ADMIN_SRC : USER_SRC
          return path.resolve(base, source)
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
