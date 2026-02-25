import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// ---------------------------------------------------------------------------
// Custom plugin: resolve `@/…` imports that originate from Admin_side files.
// Admin components use `@/` which must point to Admin_side/frontend/src,
// while User components' `@/` points to User_side/src.
// ---------------------------------------------------------------------------
const ADMIN_SRC = path.resolve(__dirname, '../Admin_side/frontend/src')

function adminAliasResolver(): Plugin {
  return {
    name: 'admin-alias-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source.startsWith('@/') &&
        importer &&
        (importer.replace(/\\/g, '/').includes('Admin_side/frontend/src') ||
          importer.replace(/\\/g, '/').includes('Admin_side/frontend/node_modules'))
      ) {
        return path.resolve(ADMIN_SRC, source.slice(2))
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    adminAliasResolver(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // All /api/* requests → unified backend on 8000
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: [
      // User app alias (default @)
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // Admin app alias (@admin)
      { find: '@admin', replacement: ADMIN_SRC },
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      // Prevent rollup from treating large admin bundle as warning
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      },
    },
  },
})
