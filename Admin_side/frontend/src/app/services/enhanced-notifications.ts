// Enhanced Notification Service with Color Coding
// Success (Green), Error (Red), Info (Blue), Warning (Orange)

import { toast as sonnerToast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
}

// Color styles for each notification type
const notificationStyles = {
  success: {
    background: '#10B981',
    color: '#FFFFFF',
    border: '2px solid #059669',
    icon: '✓',
  },
  error: {
    background: '#EF4444',
    color: '#FFFFFF',
    border: '2px solid #DC2626',
    icon: '✕',
  },
  info: {
    background: '#3B82F6',
    color: '#FFFFFF',
    border: '2px solid #2563EB',
    icon: 'ℹ',
  },
  warning: {
    background: '#F59E0B',
    color: '#FFFFFF',
    border: '2px solid #D97706',
    icon: '⚠',
  },
};

class EnhancedNotificationService {
  // Show success notification (Green)
  success(message: string, options?: NotificationOptions) {
    const style = notificationStyles.success;
    sonnerToast.success(options?.title || message, {
      description: options?.description,
      duration: options?.duration || 4000,
      style: {
        background: style.background,
        color: style.color,
        border: style.border,
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '500',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      icon: style.icon,
    });
  }

  // Show error notification (Red)
  error(message: string, options?: NotificationOptions) {
    const style = notificationStyles.error;
    sonnerToast.error(options?.title || message, {
      description: options?.description,
      duration: options?.duration || 5000,
      style: {
        background: style.background,
        color: style.color,
        border: style.border,
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '500',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      icon: style.icon,
    });
  }

  // Show info notification (Blue)
  info(message: string, options?: NotificationOptions) {
    const style = notificationStyles.info;
    sonnerToast(options?.title || message, {
      description: options?.description,
      duration: options?.duration || 4000,
      style: {
        background: style.background,
        color: style.color,
        border: style.border,
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '500',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      icon: style.icon,
    });
  }

  // Show warning notification (Orange)
  warning(message: string, options?: NotificationOptions) {
    const style = notificationStyles.warning;
    sonnerToast(options?.title || message, {
      description: options?.description,
      duration: options?.duration || 4000,
      style: {
        background: style.background,
        color: style.color,
        border: style.border,
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '500',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      icon: style.icon,
    });
  }

  // Show loading notification
  loading(message: string) {
    return sonnerToast.loading(message, {
      style: {
        background: '#6B7280',
        color: '#FFFFFF',
        border: '2px solid #4B5563',
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '500',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
    });
  }

  // Dismiss a notification
  dismiss(toastId: string | number) {
    sonnerToast.dismiss(toastId);
  }

  // Promise-based notification (for async operations)
  async promise<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    const loadingToast = this.loading(options.loading);
    
    try {
      const result = await promise;
      this.dismiss(loadingToast);
      const successMessage = typeof options.success === 'function' 
        ? options.success(result) 
        : options.success;
      this.success(successMessage);
      return result;
    } catch (error) {
      this.dismiss(loadingToast);
      const errorMessage = typeof options.error === 'function' 
        ? options.error(error) 
        : options.error;
      this.error(errorMessage);
      throw error;
    }
  }
}

// Export singleton instance
export const notify = new EnhancedNotificationService();

// Usage examples:
// notify.success('Order placed successfully!');
// notify.error('Failed to process payment', { description: 'Please try again' });
// notify.info('New order received from Table 5');
// notify.warning('Low stock alert for Paneer');
// 
// await notify.promise(
//   fetchData(),
//   {
//     loading: 'Loading data...',
//     success: 'Data loaded successfully!',
//     error: 'Failed to load data'
//   }
// );
