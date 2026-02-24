/**
 * Notification Service
 * Manages system notifications with real-time updates
 */

export type NotificationType = 
  | 'order_created'
  | 'order_ready'
  | 'table_occupied'
  | 'checkout_completed'
  | 'chat_message'
  | 'system_alert'
  | 'staff_action';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedModule?: string;
  relatedId?: string;
  icon?: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
    this.initializeRestaurantEventListeners();
    this.initializeChatEventListeners();
  }

  private initializeRestaurantEventListeners() {
    // Listen to restaurant state events
    if (typeof window !== 'undefined') {
      import('@/app/services/restaurant-state').then(({ restaurantState }) => {
        restaurantState.subscribe((event) => {
          switch (event.type) {
            case 'ORDER_CREATED':
              this.addNotification({
                type: 'order_created',
                title: 'New Order Created',
                message: `Order for Table ${event.payload.tableNumber} by ${event.payload.waiterName}`,
                relatedModule: 'orders',
                relatedId: event.payload.id,
                icon: '🛒'
              });
              break;

            case 'ORDER_STATUS_CHANGED':
              if (event.payload.status === 'ready') {
                const order = restaurantState.getOrder(event.payload.orderId);
                if (order) {
                  this.addNotification({
                    type: 'order_ready',
                    title: 'Order Ready to Serve',
                    message: `Table ${order.tableNumber} - Order is ready!`,
                    relatedModule: 'tables',
                    relatedId: order.tableId,
                    icon: '✅'
                  });
                }
              }
              break;

            case 'WAITER_ASSIGNED':
              this.addNotification({
                type: 'staff_action',
                title: 'Waiter Assigned',
                message: `${event.payload.waiterName} assigned to Table`,
                relatedModule: 'tables',
                relatedId: event.payload.tableId,
                icon: '👤'
              });
              break;

            case 'CHECKOUT_COMPLETED':
              this.addNotification({
                type: 'checkout_completed',
                title: 'Checkout Completed',
                message: 'Table ready for cleaning',
                relatedModule: 'tables',
                relatedId: event.payload.tableId,
                icon: '💰'
              });
              break;

            case 'TABLE_CLEANED':
              this.addNotification({
                type: 'system_alert',
                title: 'Table Cleaned',
                message: 'Table is now available',
                relatedModule: 'tables',
                relatedId: event.payload.tableId,
                icon: '✨'
              });
              break;
          }
        });
      });
    }
  }

  private initializeChatEventListeners() {
    // Listen to chat messages
    if (typeof window !== 'undefined') {
      window.addEventListener('new-admin-notification', ((event: CustomEvent) => {
        const { title, message, senderRole } = event.detail || {};
        if (title && message) {
          this.addNotification({
            type: 'chat_message',
            title: title,
            message: message,
            relatedModule: 'dashboard',
            icon: '💬'
          });
        }
      }) as EventListener);
    }
  }

  addNotification(data: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...data
    };

    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveToStorage();
    this.notifyListeners();

    // Dispatch custom event for notification count update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification-added'));
    }
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-read'));
      }
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.notifyListeners();
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification-read'));
    }
  }

  clearNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveToStorage();
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_notifications', JSON.stringify(this.notifications));
      } catch (e) {
        console.error('Failed to save notifications:', e);
      }
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('app_notifications');
        if (stored) {
          this.notifications = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to load notifications:', e);
        this.notifications = [];
      }
    }
  }

  // Method to add system alerts
  addSystemAlert(title: string, message: string) {
    this.addNotification({
      type: 'system_alert',
      title,
      message,
      icon: '⚠️'
    });
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Initialize on load
if (typeof window !== 'undefined') {
  // Add some sample notifications for testing
  if (notificationService.getNotifications().length === 0) {
    notificationService.addNotification({
      type: 'system_alert',
      title: 'Welcome to RMS',
      message: 'Restaurant Management System is ready',
      icon: '👋'
    });
  }
}