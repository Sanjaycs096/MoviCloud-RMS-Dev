import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { cn } from '@/app/components/ui/utils';
import { 
  Bell,
  BellRing,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Settings,
  AlertCircle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'reservation' | 'system' | 'chat';
  title: string;
  message: string;
  recipient: string;
  channel: 'email' | 'sms' | 'push' | 'internal';
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  senderRole?: string;
}

export function NotificationManagement() {
  const [activeTab, setActiveTab] = useState('settings');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [reservationAlerts, setReservationAlerts] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [staffAlerts, setStaffAlerts] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      title: 'New Order Received',
      message: 'Order #1234 placed for Table 5 - ₹850',
      recipient: 'kitchen@restaurant.com',
      channel: 'email',
      status: 'sent',
      timestamp: '2026-01-28 15:30:25',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Confirmed',
      message: 'Payment of ₹1,250 received for Order #1235',
      recipient: '+91 98765 43210',
      channel: 'sms',
      status: 'sent',
      timestamp: '2026-01-28 15:28:15',
    },
    {
      id: '3',
      type: 'reservation',
      title: 'New Reservation',
      message: 'Table reservation for 4 people at 8:00 PM',
      recipient: 'manager@restaurant.com',
      channel: 'email',
      status: 'sent',
      timestamp: '2026-01-28 15:15:42',
    },
    {
      id: '4',
      type: 'order',
      title: 'Order Ready',
      message: 'Order #1233 is ready for pickup/delivery',
      recipient: 'customer@example.com',
      channel: 'push',
      status: 'sent',
      timestamp: '2026-01-28 15:10:08',
    },
    {
      id: '5',
      type: 'payment',
      title: 'Payment Failed',
      message: 'Payment attempt failed for Order #1236',
      recipient: '+91 99887 76543',
      channel: 'sms',
      status: 'failed',
      timestamp: '2026-01-28 14:55:30',
    },
    {
      id: '6',
      type: 'system',
      title: 'Low Stock Alert',
      message: 'Chicken stock is running low (5kg remaining)',
      recipient: 'inventory@restaurant.com',
      channel: 'email',
      status: 'sent',
      timestamp: '2026-01-28 14:45:12',
    },
    {
      id: '7',
      type: 'chat',
      title: 'Message from Chef',
      message: 'Chicken stock unavailable for next 2 hours',
      recipient: 'Manager',
      channel: 'internal',
      status: 'sent',
      timestamp: '2026-01-29 10:15:00',
      senderRole: 'Chef',
    }
  ]);

  useEffect(() => {
    const handleNewNotification = (event: any) => {
      const data = event.detail;
      const newNotif: Notification = {
        id: data.id,
        type: data.type || 'system',
        title: data.title,
        message: data.message,
        recipient: data.recipient || 'Admin',
        channel: data.channel || 'internal',
        status: 'sent',
        timestamp: data.timestamp || new Date().toLocaleString(),
        senderRole: data.senderRole,
      };
      setNotifications(prev => [newNotif, ...prev]);
    };

    window.addEventListener('new-admin-notification' as any, handleNewNotification);
    return () => window.removeEventListener('new-admin-notification' as any, handleNewNotification);
  }, []);

  const openChatWithRole = (role: string) => {
    window.dispatchEvent(new CustomEvent('open-chat', { detail: { role } }));
  };

  const saveNotificationSettings = () => {
    toast.success('Notification settings saved successfully!');
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <BellRing className="h-4 w-4" />;
      case 'payment':
        return <CheckCircle className="h-4 w-4" />;
      case 'reservation':
        return <Clock className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel: Notification['channel']) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'internal':
        return <User className="h-4 w-4 text-gray-400" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Notification['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-notifications-module min-h-screen space-y-6">
      <div className="module-container flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg">Notifications</h2>
          <p className="text-sm text-gray-200 mt-1">
            Configure notification preferences and view notification history
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="w-full overflow-x-auto pb-4">
        <nav className="flex gap-3 min-w-max p-1">
          {[
            { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure preferences' },
            { id: 'history', label: 'History', icon: Bell, description: 'Notification logs' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors text-left min-w-[220px]',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-muted shadow-sm'
                )}
              >
                <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', isActive ? '' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', isActive ? '' : '')}>
                    {item.label}
                  </p>
                  <p className={cn('text-xs mt-0.5', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* TabsList removed and replaced by horizontal nav above */}

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Enable or disable notification channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Label htmlFor="email-notifications" className="text-base cursor-pointer">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <Label htmlFor="sms-notifications" className="text-base cursor-pointer">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via SMS
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <Label htmlFor="push-notifications" className="text-base cursor-pointer">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via app push
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Notifications</CardTitle>
              <CardDescription>Choose which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="order-alerts" className="cursor-pointer">Order Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    New orders, order status updates, order ready
                  </p>
                </div>
                <Switch
                  id="order-alerts"
                  checked={orderAlerts}
                  onCheckedChange={setOrderAlerts}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="payment-alerts" className="cursor-pointer">Payment Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Payment confirmations, failures, refunds
                  </p>
                </div>
                <Switch
                  id="payment-alerts"
                  checked={paymentAlerts}
                  onCheckedChange={setPaymentAlerts}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="reservation-alerts" className="cursor-pointer">Reservation Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    New reservations, reminders, cancellations
                  </p>
                </div>
                <Switch
                  id="reservation-alerts"
                  checked={reservationAlerts}
                  onCheckedChange={setReservationAlerts}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="inventory-alerts" className="cursor-pointer">Inventory Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Low stock, expiry warnings, restock needs
                  </p>
                </div>
                <Switch
                  id="inventory-alerts"
                  checked={inventoryAlerts}
                  onCheckedChange={setInventoryAlerts}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="staff-alerts" className="cursor-pointer">Staff Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Attendance, schedule changes, performance
                  </p>
                </div>
                <Switch
                  id="staff-alerts"
                  checked={staffAlerts}
                  onCheckedChange={setStaffAlerts}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Recipients</CardTitle>
              <CardDescription>Configure who receives notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <Label>Order Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    kitchen@restaurant.com<br />
                    manager@restaurant.com
                  </p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <Label>Payment Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    accounts@restaurant.com<br />
                    admin@restaurant.com
                  </p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <Label>Reservation Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    manager@restaurant.com<br />
                    frontdesk@restaurant.com
                  </p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <Label>Inventory Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    inventory@restaurant.com<br />
                    manager@restaurant.com
                  </p>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Edit Recipients
              </Button>
            </CardContent>
          </Card>

          <Button onClick={saveNotificationSettings} className="w-full" size="lg">
            <Send className="h-5 w-5 mr-2" />
            Save Notification Settings
          </Button>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => n.status === 'sent').length}
                </div>
                <p className="text-xs text-green-600 mt-1">Successfully delivered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => n.status === 'failed').length}
                </div>
                <p className="text-xs text-red-600 mt-1">Delivery failed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => n.status === 'pending').length}
                </div>
                <p className="text-xs text-yellow-600 mt-1">Awaiting delivery</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((notifications.filter(n => n.status === 'sent').length / notifications.length) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Delivery success</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>Recent notification activity log</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map(notification => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(notification.type)}
                          <span className="capitalize">{notification.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-col gap-1">
                          <span className="truncate">{notification.message}</span>
                          {notification.type === 'chat' && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="h-auto p-0 justify-start text-xs font-semibold text-primary"
                              onClick={() => openChatWithRole(notification.senderRole || 'Admin')}
                            >
                              Open Chat
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{notification.recipient}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(notification.channel)}
                          <span className="capitalize">{notification.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{notification.timestamp}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status === 'sent' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {notification.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {notification.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {notification.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
