// API Configuration - Using FastAPI backend
// Uses environment variable or defaults to production URL

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restaurant-management-system-24c2.onrender.com/api';

// Legacy exports (kept for compatibility, not used with local backend)
export const projectId = 'localhost';
export const publicAnonKey = '';
