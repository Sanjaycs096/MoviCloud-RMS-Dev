import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Helper to try multiple extensions
function resolveWithExts(basePath: string): string | null {
  const exts = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js']
  for (const ext of exts) {
    const candidate = basePath + ext
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
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
      // Custom resolver for @ alias - directs to Admin_side if importer is from Admin_side
      {
        find: /^@\/(.*)$/,
        replacement: '',
        customResolver(source, importer) {
          const match = source.match(/^@\/(.*)$/)
          if (!match) return null
          
          const importPath = match[1]
          
          // Check if importer is from Admin_side
          const isAdminCode = importer && importer.includes('Admin_side')
          
          const baseDir = isAdminCode
            ? path.resolve(__dirname, '../Admin_side/frontend/src')
            : path.resolve(__dirname, './src')
          
          const resolved = path.join(baseDir, importPath)
          return resolveWithExts(resolved) || resolved
        }
      },
      // Static alias for @admin always points to Admin_side
      {
        find: '@admin',
        replacement: path.resolve(__dirname, '../Admin_side/frontend/src')
      }
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
