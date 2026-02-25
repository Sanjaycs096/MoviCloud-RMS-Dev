/**
 * Admin app entry wrapper.
 * Importing this file brings in Admin-side CSS (scoped to this chunk
 * when Vite performs code-splitting via React.lazy).
 */

// Admin global styles — bridge file that resolves tailwindcss from User_side/node_modules
// (avoids "Can't resolve tailwindcss in Admin_side/frontend/node_modules" at build time)
import '@/styles/admin.css'

// Re-export the Admin app root
export { default } from '@admin/app/App'
