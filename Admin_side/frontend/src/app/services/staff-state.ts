// Enhanced Staff State Service - Connects Staff with Reports
// This service maintains staff state and provides live updates to Reports module

interface StaffMember {
  id: string;
  name: string;
  role: 'chef' | 'waiter' | 'cashier' | 'manager' | 'delivery';
  phone?: string;
  email?: string;
  shift?: string;
  status: 'active' | 'leave' | 'busy';
  ordersHandled: number;
  avgServiceTime: string;
  rating: number;
  attendance: string;
  performanceScore: number;
  createdAt: string;
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  onLeaveStaff: number;
  busyStaff: number;
  ordersHandledToday: number;
  avgPerformanceScore: number;
}

class StaffStateService {
  private staff: StaffMember[] = [];
  private listeners: Array<() => void> = [];
  private statsListeners: Array<(stats: StaffStats) => void> = [];

  // Subscribe to staff changes
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Subscribe to stats changes (for Reports module)
  subscribeToStats(listener: (stats: StaffStats) => void) {
    this.statsListeners.push(listener);
    // Immediately call with current stats
    listener(this.getStats());
    return () => {
      this.statsListeners = this.statsListeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notify() {
    this.listeners.forEach(listener => listener());
    this.notifyStats();
  }

  // Notify stats listeners
  private notifyStats() {
    const stats = this.getStats();
    this.statsListeners.forEach(listener => listener(stats));
    
    // Also dispatch custom event for dashboard
    window.dispatchEvent(new CustomEvent('staff-stats-updated', { detail: stats }));
  }

  // Set staff list
  setStaff(staff: StaffMember[]) {
    this.staff = staff;
    this.notify();
  }

  // Get all staff
  getStaff(): StaffMember[] {
    return this.staff;
  }

  // Get staff by ID
  getStaffById(id: string): StaffMember | undefined {
    return this.staff.find(s => s.id === id);
  }

  // Update staff status
  updateStaffStatus(id: string, status: 'active' | 'leave' | 'busy') {
    this.staff = this.staff.map(s => 
      s.id === id ? { ...s, status } : s
    );
    this.notify();
  }

  // Increment orders handled
  incrementOrdersHandled(staffId: string) {
    this.staff = this.staff.map(s => 
      s.id === staffId ? { ...s, ordersHandled: s.ordersHandled + 1 } : s
    );
    this.notify();
  }

  // Get staff statistics
  getStats(): StaffStats {
    const totalStaff = this.staff.length;
    const activeStaff = this.staff.filter(s => s.status === 'active').length;
    const onLeaveStaff = this.staff.filter(s => s.status === 'leave').length;
    const busyStaff = this.staff.filter(s => s.status === 'busy').length;
    const ordersHandledToday = this.staff.reduce((sum, s) => sum + s.ordersHandled, 0);
    const avgPerformanceScore = totalStaff > 0
      ? Math.round(this.staff.reduce((sum, s) => sum + s.performanceScore, 0) / totalStaff)
      : 0;

    return {
      totalStaff,
      activeStaff,
      onLeaveStaff,
      busyStaff,
      ordersHandledToday,
      avgPerformanceScore,
    };
  }

  // Get staff grouped by role
  getStaffByRole(): Record<string, StaffMember[]> {
    return this.staff.reduce((acc, staff) => {
      if (!acc[staff.role]) {
        acc[staff.role] = [];
      }
      acc[staff.role].push(staff);
      return acc;
    }, {} as Record<string, StaffMember[]>);
  }

  // Get top performers
  getTopPerformers(limit: number = 5): StaffMember[] {
    return [...this.staff]
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, limit);
  }

  // Add new staff member
  addStaff(staff: StaffMember) {
    this.staff.push(staff);
    this.notify();
  }

  // Remove staff member
  removeStaff(id: string) {
    this.staff = this.staff.filter(s => s.id !== id);
    this.notify();
  }

  // Update staff details
  updateStaff(id: string, updates: Partial<StaffMember>) {
    this.staff = this.staff.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    this.notify();
  }
}

// Export singleton instance
export const staffStateService = new StaffStateService();

// Export types
export type { StaffMember, StaffStats };
