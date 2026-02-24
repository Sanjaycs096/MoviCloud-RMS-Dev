/**
 * API Service for connecting to FastAPI Backend
 * Restaurant Management System
 */

// Backend API base URL - use env variable or default to production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restaurant-management-system-24c2.onrender.com/api';

// Get current user info from localStorage (for audit headers)
const getCurrentUser = () => {
  const user = localStorage.getItem('rms_current_user');
  return user ? JSON.parse(user) : { id: 'anonymous', name: 'Anonymous' };
};

// Common headers for all requests
const getHeaders = () => {
  const user = getCurrentUser();
  return {
    'Content-Type': 'application/json',
    'x-user-id': user.id || '',
    'x-user-name': user.name || user.email || '',
  };
};

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}


// ============ AUTH API ============
export const authApi = {
  // Login with email and password
  login: (email: string, password: string) => 
    fetchApi<{ success: boolean; user: { id: string; email: string; name: string; role: string; phone?: string; shift?: string; department?: string } }>('/staff/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};


// ============ STAFF API ============
export const staffApi = {
  // List all staff with optional filters
  list: (params?: { role?: string; active?: boolean; shift?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.active !== undefined) query.append('active', String(params.active));
    if (params?.shift) query.append('shift', params.shift);
    return fetchApi<any[]>(`/staff?${query.toString()}`);
  },

  // Alias for list - get all staff
  getAll: () => fetchApi<any[]>('/staff'),

  // Get staff statistics
  getStats: () => fetchApi<any>('/staff/stats'),

  // Get single staff member
  get: (id: string) => fetchApi<any>(`/staff/${id}`),

  // Create new staff member
  create: (data: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    phone?: string;
    shift?: string;
    department?: string;
    salary?: number;
    active?: boolean;
  }) => fetchApi<any>('/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update staff member
  update: (id: string, data: Partial<{
    name: string;
    role: string;
    phone: string;
    shift: string;
    department: string;
    salary: number;
    active: boolean;
    password: string;
  }>) => fetchApi<any>(`/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete staff member
  delete: (id: string) => fetchApi<{ success: boolean }>(`/staff/${id}`, {
    method: 'DELETE',
  }),

  // Activate staff member
  activate: (id: string) => fetchApi<{ success: boolean }>(`/staff/${id}/activate`, {
    method: 'POST',
  }),

  // Deactivate staff member
  deactivate: (id: string) => fetchApi<{ success: boolean }>(`/staff/${id}/deactivate`, {
    method: 'POST',
  }),

  // Export staff as CSV
  exportCsv: (params?: { role?: string; active?: boolean; shift?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.active !== undefined) query.append('active', String(params.active));
    if (params?.shift) query.append('shift', params.shift);
    return fetchApi<{ csv: string; filename: string }>(`/staff/export/csv?${query.toString()}`);
  },

  // Export attendance as CSV
  exportAttendanceCsv: (params?: { staffId?: string; date_from?: string; date_to?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.status) query.append('status', params.status);
    return fetchApi<{ csv: string; filename: string }>(`/staff/attendance/export/csv?${query.toString()}`);
  },

  // Export shifts as CSV
  exportShiftsCsv: (params?: { staffId?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    return fetchApi<{ csv: string; filename: string }>(`/staff/shifts/export/csv?${query.toString()}`);
  },

  // Export payroll as CSV
  exportPayrollCsv: (params?: { date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    return fetchApi<{ csv: string; filename: string }>(`/staff/payroll/export/csv?${query.toString()}`);
  },
};


// ============ SHIFTS API ============
export const shiftsApi = {
  // List all shifts
  list: (params?: { staffId?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    return fetchApi<any[]>(`/staff/shifts/all?${query.toString()}`);
  },

  // Create shift assignment
  create: (data: {
    staffId: string;
    shiftType: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => fetchApi<any>('/staff/shifts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Delete shift
  delete: (id: string) => fetchApi<{ success: boolean }>(`/staff/shifts/${id}`, {
    method: 'DELETE',
  }),
};


// ============ ATTENDANCE API ============
export const attendanceApi = {
  // List attendance records
  list: (params?: { staffId?: string; date_from?: string; date_to?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.status) query.append('status', params.status);
    return fetchApi<any[]>(`/staff/attendance/all?${query.toString()}`);
  },

  // Record attendance
  record: (data: {
    staffId: string;
    date: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    hoursWorked?: number;
    notes?: string;
  }) => fetchApi<any>('/staff/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Get attendance summary
  getSummary: (params?: { month?: number; year?: number }) => {
    const query = new URLSearchParams();
    if (params?.month) query.append('month', String(params.month));
    if (params?.year) query.append('year', String(params.year));
    return fetchApi<any[]>(`/staff/attendance/summary?${query.toString()}`);
  },
};


// ============ PERFORMANCE API ============
export const performanceApi = {
  // List performance logs
  list: (params?: { staffId?: string; metric?: string; period?: string }) => {
    const query = new URLSearchParams();
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.metric) query.append('metric', params.metric);
    if (params?.period) query.append('period', params.period);
    return fetchApi<any[]>(`/staff/performance/all?${query.toString()}`);
  },

  // Log performance
  log: (data: {
    staffId: string;
    metric: string;
    value: number;
    period?: string;
    notes?: string;
  }) => fetchApi<any>('/staff/performance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Get performance summary for staff
  getSummary: (staffId: string) => fetchApi<any>(`/staff/performance/summary/${staffId}`),
};


// ============ SETTINGS API ============
export const settingsApi = {
  // List all settings
  list: (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return fetchApi<any[]>(`/settings${query}`);
  },

  // Get single setting
  get: (key: string) => fetchApi<any>(`/settings/key/${key}`),

  // Create or update setting
  upsert: (data: {
    key: string;
    value: any;
    description?: string;
    category?: string;
  }) => fetchApi<any>('/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Delete setting
  delete: (key: string) => fetchApi<{ success: boolean }>(`/settings/key/${key}`, {
    method: 'DELETE',
  }),
};


// ============ SYSTEM CONFIG API ============
export const systemConfigApi = {
  // Get system configuration
  get: () => fetchApi<any>('/settings/system-config'),

  // Update system configuration
  update: (data: Partial<{
    restaurantName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contactNumber: string;
    email: string;
    website: string;
    operatingHours: string;
    currency: string;
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
  }>) => fetchApi<any>('/settings/system-config', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};


// ============ ROLES API ============
export const rolesApi = {
  // List all roles
  list: () => fetchApi<any[]>('/settings/roles'),
  
  // Alias for list
  getAll: () => fetchApi<any[]>('/settings/roles'),

  // Get single role
  get: (id: string) => fetchApi<any>(`/settings/roles/${id}`),

  // Create new role
  create: (data: {
    name: string;
    description?: string;
    permissions: Record<string, boolean>;
  }) => fetchApi<any>('/settings/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update role
  update: (id: string, data: {
    name?: string;
    description?: string;
    permissions?: Record<string, boolean>;
  }) => fetchApi<any>(`/settings/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete role
  delete: (id: string) => fetchApi<{ success: boolean }>(`/settings/roles/${id}`, {
    method: 'DELETE',
  }),
};


// ============ SECURITY API ============
export const securityApi = {
  // Change password
  changePassword: (data: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) => fetchApi<{ success: boolean; message: string }>('/settings/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Request password reset
  resetPassword: (email: string) => fetchApi<{ success: boolean; message: string }>('/settings/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
};


// ============ BACKUP API ============
export const backupApi = {
  // List all backups
  list: () => fetchApi<any[]>('/settings/backups'),

  // Get backup config
  getConfig: () => fetchApi<any>('/settings/backup-config'),

  // Get Google Drive status
  getGDriveStatus: () => fetchApi<{
    configured: boolean;
    enabled: boolean;
    serviceAvailable: boolean;
    credentialsFound: boolean;
    folderAccessible?: boolean;
    backupsInDrive?: number;
    error?: string;
  }>('/settings/gdrive-status'),

  // Update backup config
  updateConfig: (data: {
    autoBackupEnabled: boolean;
    frequency: string;
    backupTime?: string;
    retentionDays: number;
    backupLocation?: string;
    googleDriveEnabled?: boolean;
    googleDriveFolderId?: string | null;
  }) => fetchApi<any>('/settings/backup-config', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Create backup
  create: (data?: {
    name?: string;
    type?: string;
    collections?: string[];
  }) => fetchApi<any>('/settings/backups', {
    method: 'POST',
    body: JSON.stringify(data || {}),
  }),

  // Restore backup
  restore: (id: string) => fetchApi<{ success: boolean; message: string }>(`/settings/backups/${id}/restore`, {
    method: 'POST',
  }),

  // Delete backup
  delete: (id: string) => fetchApi<{ success: boolean }>(`/settings/backups/${id}`, {
    method: 'DELETE',
  }),
};


// ============ TAX CONFIG API ============
export const taxConfigApi = {
  // Get tax configuration
  get: () => fetchApi<{
    gstEnabled: boolean;
    gstRate: number;
    cgstRate: number;
    sgstRate: number;
    serviceChargeEnabled: boolean;
    serviceChargeRate: number;
    packagingChargeEnabled: boolean;
    packagingChargeRate: number;
  }>('/settings/tax-config'),

  // Update tax configuration
  update: (data: {
    gstEnabled?: boolean;
    gstRate?: number;
    cgstRate?: number;
    sgstRate?: number;
    serviceChargeEnabled?: boolean;
    serviceChargeRate?: number;
    packagingChargeEnabled?: boolean;
    packagingChargeRate?: number;
  }) => fetchApi<any>('/settings/tax-config', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};


// ============ DISCOUNT RULES API ============
export const discountRulesApi = {
  // List all discount rules
  list: () => fetchApi<any[]>('/settings/discounts'),

  // Get a single discount rule
  get: (id: string) => fetchApi<any>(`/settings/discounts/${id}`),

  // Create a new discount rule
  create: (data: {
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    enabled?: boolean;
  }) => fetchApi<any>('/settings/discounts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update a discount rule
  update: (id: string, data: {
    name?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    enabled?: boolean;
  }) => fetchApi<any>(`/settings/discounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete a discount rule
  delete: (id: string) => fetchApi<{ success: boolean }>(`/settings/discounts/${id}`, {
    method: 'DELETE',
  }),

  // Toggle a discount rule enabled status
  toggle: (id: string) => fetchApi<any>(`/settings/discounts/${id}/toggle`, {
    method: 'POST',
  }),
};


// ============ USER ACCOUNTS API ============
export const userAccountsApi = {
  // List all user accounts
  list: () => fetchApi<any[]>('/settings/users'),

  // Create a new user account
  create: (data: {
    name: string;
    email: string;
    role: string;
    password: string;
  }) => fetchApi<any>('/settings/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update a user account
  update: (id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    status?: 'active' | 'inactive';
    password?: string;
  }) => fetchApi<any>(`/settings/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete a user account
  delete: (id: string) => fetchApi<{ success: boolean }>(`/settings/users/${id}`, {
    method: 'DELETE',
  }),

  // Toggle user active status
  toggleStatus: (id: string) => fetchApi<any>(`/settings/users/${id}/toggle-status`, {
    method: 'POST',
  }),
};


// ============ AUDIT API ============
export const auditApi = {
  // List audit logs
  list: (params?: {
    action?: string;
    userId?: string;
    resource?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    skip?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.userId) query.append('userId', params.userId);
    if (params?.resource) query.append('resource', params.resource);
    if (params?.status) query.append('status', params.status);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.skip) query.append('skip', String(params.skip));
    return fetchApi<{ data: any[]; total: number }>(`/audit?${query.toString()}`);
  },

  // Get audit stats
  getStats: () => fetchApi<any>('/audit/stats'),

  // Get unique actions
  getActions: () => fetchApi<string[]>('/audit/actions'),

  // Get unique resources
  getResources: () => fetchApi<string[]>('/audit/resources'),

  // Get single audit log
  get: (id: string) => fetchApi<any>(`/audit/${id}`),

  // Export audit logs
  export: (params?: {
    format?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.format) query.append('format', params.format);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.limit) query.append('limit', String(params.limit));
    return fetchApi<{ data: any[]; count: number }>(`/audit/export?${query.toString()}`);
  },

  // Cleanup old logs
  cleanup: (days: number = 90) => fetchApi<{ success: boolean; deleted_count: number }>(`/audit/cleanup?days=${days}`, {
    method: 'DELETE',
  }),
};


// ============ MENU API ============
export const menuApi = {
  // List menu items
  list: (params?: { category?: string; available?: boolean; dietType?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.available !== undefined) query.append('available', String(params.available));
    if (params?.dietType) query.append('dietType', params.dietType);
    if (params?.search) query.append('search', params.search);
    return fetchApi<any[]>(`/menu?${query.toString()}`);
  },

  // Get stats
  getStats: () => fetchApi<any>('/menu/stats'),

  // Get categories
  getCategories: () => fetchApi<string[]>('/menu/categories'),

  // Get single item
  get: (id: string) => fetchApi<any>(`/menu/${id}`),

  // Create item
  create: (data: any) => fetchApi<any>('/menu', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update item
  update: (id: string, data: any) => fetchApi<any>(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete item
  delete: (id: string) => fetchApi<{ success: boolean }>(`/menu/${id}`, {
    method: 'DELETE',
  }),

  // Toggle availability
  toggleAvailability: (id: string) => fetchApi<any>(`/menu/${id}/availability`, {
    method: 'PATCH',
  }),

  // Combos
listCombos: () => fetchApi<any[]>('/menu/combos'),
  createCombo: (data: any) => fetchApi<any>('/menu/combos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCombo: (id: string, data: any) => fetchApi<any>(`/menu/combos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCombo: (id: string) => fetchApi<{ success: boolean }>(`/menu/combos/${id}`, {
    method: 'DELETE',
  }),
  toggleComboAvailability: (id: string, available: boolean) => fetchApi<any>(`/menu/combos/${id}/availability?available=${available}`, {
    method: 'PATCH',
  }),
};


// ============ ORDERS API ============
export const ordersApi = {
  // List orders
  list: (params?: { status?: string; type?: string; tableId?: string; waiterId?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.tableId) query.append('tableId', params.tableId);
    if (params?.waiterId) query.append('waiter_id', params.waiterId);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    return fetchApi<{ data: any[]; total: number }>(`/orders?${query.toString()}`);
  },

  // Get stats
  getStats: () => fetchApi<any>('/orders/stats'),

  // Get single order
  get: (id: string) => fetchApi<any>(`/orders/${id}`),

  // Create order
  create: (data: any) => fetchApi<any>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update order
  update: (id: string, data: any) => fetchApi<any>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete order
  delete: (id: string) => fetchApi<{ success: boolean }>(`/orders/${id}`, {
    method: 'DELETE',
  }),

  // Update status
  updateStatus: (id: string, status: string, deductInventory: boolean = true) => 
    fetchApi<any>(`/orders/${id}/status?status=${status}&deduct_inventory=${deductInventory}`, {
      method: 'PATCH',
    }),

  // Kitchen queue (legacy)
  getKitchenQueue: () => fetchApi<any[]>('/orders/kitchen/queue'),

  // ===== KITCHEN WORKFLOW ENDPOINTS =====
  
  // Get active orders for kitchen display
  getKitchenActiveOrders: () => fetchApi<any[]>('/orders/kitchen/active-orders'),
  
  // Get kitchen statistics
  getKitchenStats: () => fetchApi<any>('/orders/kitchen/stats'),
  
  // Start preparing - triggers inventory deduction
  startPreparing: (id: string) => fetchApi<any>(`/orders/kitchen/start-preparing/${id}`, {
    method: 'POST',
  }),
  
  // Mark as ready - notifies waiters
  markReady: (id: string) => fetchApi<any>(`/orders/kitchen/mark-ready/${id}`, {
    method: 'POST',
  }),
  
  // Complete serving
  completeServing: (id: string) => fetchApi<any>(`/orders/kitchen/complete/${id}`, {
    method: 'POST',
  }),

  // ===== UNIFIED WORKFLOW =====
  
  // Process order through workflow
  processWorkflow: (data: { orderId: string; action: string }) => fetchApi<any>('/orders/workflow/process-order', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update item status
  updateItemStatus: (orderId: string, itemIndex: number, status: string) =>
    fetchApi<any>(`/orders/${orderId}/item-status?item_index=${itemIndex}&status=${status}`, {
      method: 'PATCH',
    }),
};


// ============ TABLES API ============
export const tablesApi = {
  // List tables
  list: (params?: { status?: string; location?: string; minCapacity?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.location) query.append('location', params.location);
    if (params?.minCapacity) query.append('minCapacity', String(params.minCapacity));
    return fetchApi<{ data: any[]; total: number }>(`/tables?${query.toString()}`);
  },

  // Get stats
  getStats: () => fetchApi<any>('/tables/stats'),

  // Get single table
  get: (id: string) => fetchApi<any>(`/tables/${id}`),

  // Create table
  create: (data: any) => fetchApi<any>('/tables', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update table
  update: (id: string, data: any) => fetchApi<any>(`/tables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete table
  delete: (id: string) => fetchApi<{ success: boolean }>(`/tables/${id}`, {
    method: 'DELETE',
  }),

  // Update status
  updateStatus: (id: string, status: string, guests?: number, reservationId?: string) => {
    const query = new URLSearchParams({ status });
    if (guests) query.append('guests', String(guests));
    if (reservationId) query.append('reservationId', reservationId);
    return fetchApi<any>(`/tables/${id}/status?${query.toString()}`, {
      method: 'PATCH',
    });
  },

  // Reservations
  listReservations: (params?: { date?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.status) query.append('status', params.status);
    return fetchApi<any[]>(`/tables/reservations/all?${query.toString()}`);
  },
  createReservation: (data: any) => fetchApi<any>('/tables/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateReservation: (id: string, data: any) => fetchApi<any>(`/tables/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteReservation: (id: string) => fetchApi<{ success: boolean }>(`/tables/reservations/${id}`, {
    method: 'DELETE',
  }),
  
  // Waiter assignment
  assignWaiter: (tableId: string, waiterId: string, waiterName: string) =>
    fetchApi<any>(`/tables/${tableId}/waiter?waiter_id=${waiterId}&waiter_name=${encodeURIComponent(waiterName)}`, {
      method: 'POST',
    }),
  removeWaiter: (tableId: string) =>
    fetchApi<any>(`/tables/${tableId}/waiter`, {
      method: 'DELETE',
    }),
};


// ============ INVENTORY API ============
export const inventoryApi = {
  // List ingredients
  list: (params?: { category?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return fetchApi<{ data: any[]; total: number }>(`/inventory?${query.toString()}`);
  },

  // Get stats
  getStats: () => fetchApi<any>('/inventory/stats'),

  // Get low stock alerts
  getLowStock: () => fetchApi<any[]>('/inventory/low-stock'),

  // Get single ingredient
  get: (id: string) => fetchApi<any>(`/inventory/${id}`),

  // Create ingredient
  create: (data: any) => fetchApi<any>('/inventory', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update ingredient
  update: (id: string, data: any) => fetchApi<any>(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete ingredient
  delete: (id: string) => fetchApi<{ success: boolean }>(`/inventory/${id}`, {
    method: 'DELETE',
  }),

  // Update stock
  updateStock: (id: string, quantity: number, type: 'add' | 'deduct', reason?: string) =>
    fetchApi<any>(`/inventory/${id}/stock?quantity=${quantity}&type=${type}${reason ? `&reason=${reason}` : ''}`, {
      method: 'PATCH',
    }),

  // Suppliers
  listSuppliers: () => fetchApi<any[]>('/inventory/suppliers/all'),
  createSupplier: (data: any) => fetchApi<any>('/inventory/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSupplier: (id: string, data: any) => fetchApi<any>(`/inventory/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteSupplier: (id: string) => fetchApi<{ success: boolean }>(`/inventory/suppliers/${id}`, {
    method: 'DELETE',
  }),

  // Purchase records
  listPurchases: (params?: { supplierId?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    return fetchApi<any[]>(`/inventory/purchases/all?${query.toString()}`);
  },
  createPurchase: (data: any) => fetchApi<any>('/inventory/purchases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Deductions
  listDeductions: (orderId?: string) => {
    const query = orderId ? `?orderId=${orderId}` : '';
    return fetchApi<any[]>(`/inventory/deductions/all${query}`);
  },
  createDeduction: (data: any) => fetchApi<any>('/inventory/deductions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};


// ============ CUSTOMERS API ============
export const customersApi = {
  // List customers
  list: (params?: { type?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.search) query.append('search', params.search);
    return fetchApi<{ data: any[]; total: number }>(`/customers?${query.toString()}`);
  },

  // Get stats
  getStats: () => fetchApi<any>('/customers/stats'),

  // Get single customer
  get: (id: string) => fetchApi<any>(`/customers/${id}`),

  // Create customer
  create: (data: any) => fetchApi<any>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update customer
  update: (id: string, data: any) => fetchApi<any>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete customer
  delete: (id: string) => fetchApi<{ success: boolean }>(`/customers/${id}`, {
    method: 'DELETE',
  }),

  // Get order history
  getOrderHistory: (id: string) => fetchApi<any[]>(`/customers/${id}/orders`),

  // Manage points
  addPoints: (id: string, points: number, reason?: string) =>
    fetchApi<any>(`/customers/${id}/points?points=${points}&operation=add${reason ? `&reason=${reason}` : ''}`, {
      method: 'PATCH',
    }),
  deductPoints: (id: string, points: number, reason?: string) =>
    fetchApi<any>(`/customers/${id}/points?points=${points}&operation=deduct${reason ? `&reason=${reason}` : ''}`, {
      method: 'PATCH',
    }),
  getPointsHistory: (id: string) => fetchApi<any[]>(`/customers/${id}/points/history`),

  // Record order
  recordOrder: (id: string, orderTotal: number, pointsEarned: number) =>
    fetchApi<any>(`/customers/${id}/record-order?order_total=${orderTotal}&points_earned=${pointsEarned}`, {
      method: 'POST',
    }),
};


// ============ DELIVERY API ============
export const deliveryApi = {
  // Riders
  listRiders: (params?: { status?: string }) => {
    const query = params?.status ? `?status=${params.status}` : '';
    return fetchApi<any[]>(`/delivery/riders${query}`);
  },
  getRidersStats: () => fetchApi<any>('/delivery/riders/stats'),
  getRider: (id: string) => fetchApi<any>(`/delivery/riders/${id}`),
  createRider: (data: any) => fetchApi<any>('/delivery/riders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateRider: (id: string, data: any) => fetchApi<any>(`/delivery/riders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteRider: (id: string) => fetchApi<{ success: boolean }>(`/delivery/riders/${id}`, {
    method: 'DELETE',
  }),

  // Delivery orders
  listOrders: (params?: { status?: string; riderId?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.riderId) query.append('riderId', params.riderId);
    return fetchApi<{ data: any[]; total: number }>(`/delivery/orders?${query.toString()}`);
  },
  getOrdersStats: () => fetchApi<any>('/delivery/orders/stats'),
  getOrder: (id: string) => fetchApi<any>(`/delivery/orders/${id}`),
  createOrder: (data: any) => fetchApi<any>('/delivery/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateOrder: (id: string, data: any) => fetchApi<any>(`/delivery/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  assignRider: (orderId: string, riderId: string) =>
    fetchApi<any>(`/delivery/orders/${orderId}/assign?rider_id=${riderId}`, {
      method: 'PATCH',
    }),
  updateOrderStatus: (id: string, status: string) =>
    fetchApi<any>(`/delivery/orders/${id}/status?status=${status}`, {
      method: 'PATCH',
    }),

  // Zones
  listZones: () => fetchApi<any[]>('/delivery/zones'),
  createZone: (data: any) => fetchApi<any>('/delivery/zones', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateZone: (id: string, data: any) => fetchApi<any>(`/delivery/zones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteZone: (id: string) => fetchApi<{ success: boolean }>(`/delivery/zones/${id}`, {
    method: 'DELETE',
  }),
};


// ============ OFFERS API ============
export const offersApi = {
  // Coupons
  listCoupons: (params?: { status?: string }) => {
    const query = params?.status ? `?status=${params.status}` : '';
    return fetchApi<any[]>(`/offers/coupons${query}`);
  },
  getCouponsStats: () => fetchApi<any>('/offers/coupons/stats'),
  getCoupon: (id: string) => fetchApi<any>(`/offers/coupons/${id}`),
  createCoupon: (data: any) => fetchApi<any>('/offers/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCoupon: (id: string, data: any) => fetchApi<any>(`/offers/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCoupon: (id: string) => fetchApi<{ success: boolean }>(`/offers/coupons/${id}`, {
    method: 'DELETE',
  }),
  validateCoupon: (code: string, orderTotal: number) =>
    fetchApi<any>(`/offers/coupons/validate/${code}?order_total=${orderTotal}`),
  useCoupon: (id: string) => fetchApi<any>(`/offers/coupons/${id}/use`, {
    method: 'POST',
  }),

  // Memberships
  listMemberships: () => fetchApi<any[]>('/offers/memberships'),
  createMembership: (data: any) => fetchApi<any>('/offers/memberships', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateMembership: (id: string, data: any) => fetchApi<any>(`/offers/memberships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteMembership: (id: string) => fetchApi<{ success: boolean }>(`/offers/memberships/${id}`, {
    method: 'DELETE',
  }),

  // Loyalty config
  getLoyaltyConfig: () => fetchApi<any>('/offers/loyalty-config'),
  updateLoyaltyConfig: (data: any) => fetchApi<any>('/offers/loyalty-config', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Feedback
  listFeedback: (params?: { customerId?: string; orderId?: string }) => {
    const query = new URLSearchParams();
    if (params?.customerId) query.append('customer_id', params.customerId);
    if (params?.orderId) query.append('order_id', params.orderId);
    const queryStr = query.toString();
    return fetchApi<any[]>(`/offers/feedback${queryStr ? `?${queryStr}` : ''}`);
  },
  getFeedbackStats: () => fetchApi<{ totalFeedback: number; totalPointsAwarded: number; averageRating: number }>('/offers/feedback/stats'),
  createFeedback: (data: { customerName: string; customerId: string; orderId: string; rating: number; comment: string }) =>
    fetchApi<any>('/offers/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteFeedback: (id: string) => fetchApi<{ success: boolean }>(`/offers/feedback/${id}`, {
    method: 'DELETE',
  }),
};


// ============ NOTIFICATIONS API ============
export const notificationsApi = {
  // List notifications
  list: (params?: { type?: string; status?: string; channel?: string }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.channel) query.append('channel', params.channel);
    return fetchApi<{ data: any[]; total: number }>(`/notifications?${query.toString()}`);
  },

  // Get stats
  getStats: () => fetchApi<any>('/notifications/stats'),

  // Get single notification
  get: (id: string) => fetchApi<any>(`/notifications/${id}`),

  // Create notification
  create: (data: any) => fetchApi<any>('/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update notification
  update: (id: string, data: any) => fetchApi<any>(`/notifications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete notification
  delete: (id: string) => fetchApi<{ success: boolean }>(`/notifications/${id}`, {
    method: 'DELETE',
  }),

  // Send notification
  send: (id: string) => fetchApi<any>(`/notifications/send?notification_id=${id}`, {
    method: 'POST',
  }),

  // Retry failed notification
  retry: (id: string) => fetchApi<any>(`/notifications/${id}/retry`, {
    method: 'POST',
  }),

  // Settings
  listSettings: () => fetchApi<any[]>('/notifications/settings/all'),
  updateSettings: (data: any) => fetchApi<any>('/notifications/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Broadcast
  broadcast: (data: { recipientIds: string[]; title: string; message: string; channel?: string }) =>
    fetchApi<any>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};


// ============ BILLING API ============
export const billingApi = {
  // List payments
  list: (params?: { status?: string; method?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.method) query.append('method', params.method);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    return fetchApi<{ data: any[]; total: number }>(`/billing?${query.toString()}`);
  },

  // Get stats
  getStats: () => fetchApi<any>('/billing/stats'),

  // Get single payment
  get: (id: string) => fetchApi<any>(`/billing/${id}`),

  // Create payment
  create: (data: any) => fetchApi<any>('/billing', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update payment status
  updateStatus: (id: string, status: string) =>
    fetchApi<any>(`/billing/${id}/status?status=${status}`, {
      method: 'PATCH',
    }),

  // Process refund
  refund: (id: string, amount?: number, reason?: string) => {
    const query = new URLSearchParams();
    if (amount) query.append('amount', String(amount));
    if (reason) query.append('reason', reason);
    return fetchApi<any>(`/billing/${id}/refund?${query.toString()}`, {
      method: 'POST',
    });
  },

  // ===== ORDER-BILLING INTEGRATION =====
  
  // Process payment for an order
  processOrderPayment: (data: { orderId: string; method: string; amount: number; tips?: number }) => 
    fetchApi<any>('/billing/process-order-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get payment for an order
  getOrderPayment: (orderId: string) => fetchApi<any>(`/billing/order/${orderId}/payment`),
  
  // Complete checkout (payment + order completion)
  checkout: (data: { orderId: string; method: string; amount: number; tips?: number }) =>
    fetchApi<any>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Invoices
  listInvoices: (params?: { date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    return fetchApi<any[]>(`/billing/invoices/all?${query.toString()}`);
  },
  createInvoice: (data: any) => fetchApi<any>('/billing/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Tax settings
  getTaxSettings: () => fetchApi<any>('/billing/tax-settings'),
  updateTaxSettings: (data: any) => fetchApi<any>('/billing/tax-settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Reports
  getDailyReport: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return fetchApi<any>(`/billing/reports/daily${query}`);
  },
};


// ============ ANALYTICS API ============
export const analyticsApi = {
  // Get dashboard analytics
  get: () => fetchApi<any>('/analytics'),

  // Get daily analytics
  getDaily: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return fetchApi<any>(`/analytics/daily${query}`);
  },

  // Get weekly analytics
  getWeekly: () => fetchApi<any>('/analytics/weekly'),
};


// ============ RECIPES API ============
export const recipesApi = {
  // List all recipes
  list: () => fetchApi<any[]>('/recipes'),

  // Get recipe for a menu item
  get: (menuItemId: string) => fetchApi<any>(`/recipes/${menuItemId}`),

  // Create or update recipe
  save: (data: {
    menuItemId: string;
    menuItemName: string;
    ingredients: Array<{
      ingredientId: string;
      name: string;
      amount: number;
      unit: string;
    }>;
  }) => fetchApi<any>('/recipes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Delete recipe
  delete: (id: string) => fetchApi<{ success: boolean }>(`/recipes/${id}`, {
    method: 'DELETE',
  }),

  // Deduct inventory for an order
  deductForOrder: (data: {
    orderId: string;
    items: Array<{
      name: string;
      quantity: number;
      menuItemId?: string;
    }>;
  }) => fetchApi<{ success: boolean; deducted: any[]; errors: string[] | null }>('/recipes/deduct-for-order', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Get ingredients needed for a menu item
  getIngredientsForItem: (menuItemName: string) => 
    fetchApi<any>(`/recipes/ingredients-for-item/${encodeURIComponent(menuItemName)}`),
};


// Export all APIs
export default {
  staff: staffApi,
  shifts: shiftsApi,
  attendance: attendanceApi,
  performance: performanceApi,
  settings: settingsApi,
  systemConfig: systemConfigApi,
  roles: rolesApi,
  security: securityApi,
  backup: backupApi,
  audit: auditApi,
  menu: menuApi,
  orders: ordersApi,
  tables: tablesApi,
  inventory: inventoryApi,
  customers: customersApi,
  delivery: deliveryApi,
  offers: offersApi,
  notifications: notificationsApi,
  billing: billingApi,
  analytics: analyticsApi,
  recipes: recipesApi,
};
