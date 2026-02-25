/**
 * Admin app entry wrapper.
 * Importing this file brings in Admin-side CSS (scoped to this chunk
 * when Vite performs code-splitting via React.lazy).
 */

// Admin global styles — loaded only when admin route is visited
import '@admin/styles/index.css'

// Re-export the Admin app root
export { default } from '@admin/app/App'
