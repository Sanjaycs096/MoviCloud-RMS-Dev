import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import { notificationService, type Notification } from '@/app/services/notification-service';
import { cn } from '@/app/components/ui/utils';

interface NotificationPanelProps {
  onNavigate?: (module: string) => void;
}

export function NotificationPanel({ onNavigate }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Initial load
    updateNotifications();

    // Subscribe to changes
    const unsubscribe = notificationService.subscribe(() => {
      updateNotifications();
    });

    // Listen to custom events
    const handleNotificationEvent = () => {
      updateNotifications();
    };

    window.addEventListener('notification-added', handleNotificationEvent);
    window.addEventListener('notification-read', handleNotificationEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('notification-added', handleNotificationEvent);
      window.removeEventListener('notification-read', handleNotificationEvent);
    };
  }, []);

  const updateNotifications = () => {
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    notificationService.markAsRead(notification.id);

    // Navigate to related module if specified
    if (notification.relatedModule && onNavigate) {
      onNavigate(notification.relatedModule);
      setOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.clearNotification(notificationId);
  };

  const getNotificationIcon = (notification: Notification) => {
    return notification.icon || '🔔';
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" style={{ color: '#000000' }} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 z-[9999]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-base">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-8 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 text-xs"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-3 hover:bg-accent cursor-pointer transition-colors relative group",
                    !notification.read && "bg-blue-50"
                  )}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getTimeAgo(notification.timestamp)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <DropdownMenuItem
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('notifications');
                    setOpen(false);
                  }
                }}
                className="w-full text-center justify-center cursor-pointer"
              >
                View all notifications
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
