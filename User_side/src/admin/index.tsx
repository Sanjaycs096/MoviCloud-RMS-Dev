/**
 * Admin app entry wrapper.
 * Importing this file brings in Admin-side CSS (scoped to this chunk
 * when Vite performs code-splitting via React.lazy).
 */

// Admin global styles — resolved via @admin alias (bypasses Vite root restriction)
// Admin_side/frontend/node_modules/tailwindcss must exist — installed by build command
import '@admin/styles/index.css'

// Re-export the Admin app root
export { default } from '@admin/app/App'
