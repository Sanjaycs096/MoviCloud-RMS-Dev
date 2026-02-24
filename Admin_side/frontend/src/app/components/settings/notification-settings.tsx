import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import { Bell, Save, Mail, MessageSquare, Volume2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettings {
  // Order Notifications
  orderAlerts: boolean;
  newOrderAlert: boolean;
  orderStatusChange: boolean;
  orderCancellation: boolean;
  
  // Payment Notifications
  paymentConfirmations: boolean;
  paymentSuccess: boolean;
  paymentFailed: boolean;
  refundProcessed: boolean;
  
  // Reservation Notifications
  reservationReminders: boolean;
  newReservation: boolean;
  reservationCancellation: boolean;
  reservationModified: boolean;
  
  // Inventory Notifications
  inventoryAlerts: boolean;
  lowStockAlert: boolean;
  outOfStockAlert: boolean;
  expiryReminder: boolean;
  
  // Staff Notifications
  staffAlerts: boolean;
  shiftReminders: boolean;
  leaveApproval: boolean;
  
  // System Notifications
  systemAlerts: boolean;
  backupCompletion: boolean;
  securityAlerts: boolean;
  systemUpdates: boolean;
  
  // Notification Channels
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  soundAlerts: boolean;
}

const STORAGE_KEY = 'rms_notification_settings';

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    // Order Notifications
    orderAlerts: true,
    newOrderAlert: true,
    orderStatusChange: true,
    orderCancellation: true,
    
    // Payment Notifications
    paymentConfirmations: true,
    paymentSuccess: true,
    paymentFailed: true,
    refundProcessed: true,
    
    // Reservation Notifications
    reservationReminders: true,
    newReservation: true,
    reservationCancellation: true,
    reservationModified: true,
    
    // Inventory Notifications
    inventoryAlerts: true,
    lowStockAlert: true,
    outOfStockAlert: true,
    expiryReminder: true,
    
    // Staff Notifications
    staffAlerts: true,
    shiftReminders: true,
    leaveApproval: true,
    
    // System Notifications
    systemAlerts: true,
    backupCompletion: true,
    securityAlerts: true,
    systemUpdates: true,
    
    // Notification Channels
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    soundAlerts: true,
  });

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success('Notification settings saved successfully!');
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleAllOrderNotifications = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      orderAlerts: enabled,
      newOrderAlert: enabled,
      orderStatusChange: enabled,
      orderCancellation: enabled,
    }));
  };

  const toggleAllPaymentNotifications = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      paymentConfirmations: enabled,
      paymentSuccess: enabled,
      paymentFailed: enabled,
      refundProcessed: enabled,
    }));
  };

  const toggleAllReservationNotifications = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      reservationReminders: enabled,
      newReservation: enabled,
      reservationCancellation: enabled,
      reservationModified: enabled,
    }));
  };

  const toggleAllInventoryNotifications = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      inventoryAlerts: enabled,
      lowStockAlert: enabled,
      outOfStockAlert: enabled,
      expiryReminder: enabled,
    }));
  };

  return (
    <div className="bg-settings-module min-h-screen space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-black">Notification Settings</CardTitle>
                <CardDescription className="text-black">Configure alerts and notification preferences</CardDescription>
              </div>
            </div>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Notification Channels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive alerts via email</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive alerts via SMS</p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Browser push notifications</p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Sound Alerts</Label>
                    <p className="text-xs text-muted-foreground">Play sound for notifications</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundAlerts}
                  onCheckedChange={(checked) => updateSetting('soundAlerts', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order Notifications</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleAllOrderNotifications(!settings.orderAlerts)}
              >
                {settings.orderAlerts ? 'Disable All' : 'Enable All'}
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>New Order Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified when a new order is placed</p>
                </div>
                <Switch
                  checked={settings.newOrderAlert}
                  onCheckedChange={(checked) => updateSetting('newOrderAlert', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Order Status Changes</Label>
                  <p className="text-xs text-muted-foreground">Alerts when order status is updated</p>
                </div>
                <Switch
                  checked={settings.orderStatusChange}
                  onCheckedChange={(checked) => updateSetting('orderStatusChange', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Order Cancellations</Label>
                  <p className="text-xs text-muted-foreground">Notify when an order is cancelled</p>
                </div>
                <Switch
                  checked={settings.orderCancellation}
                  onCheckedChange={(checked) => updateSetting('orderCancellation', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Payment Notifications</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleAllPaymentNotifications(!settings.paymentConfirmations)}
              >
                {settings.paymentConfirmations ? 'Disable All' : 'Enable All'}
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Payment Success</Label>
                  <p className="text-xs text-muted-foreground">Confirmation when payment is successful</p>
                </div>
                <Switch
                  checked={settings.paymentSuccess}
                  onCheckedChange={(checked) => updateSetting('paymentSuccess', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Payment Failed</Label>
                  <p className="text-xs text-muted-foreground">Alert when payment fails</p>
                </div>
                <Switch
                  checked={settings.paymentFailed}
                  onCheckedChange={(checked) => updateSetting('paymentFailed', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Refund Processed</Label>
                  <p className="text-xs text-muted-foreground">Notify when refund is completed</p>
                </div>
                <Switch
                  checked={settings.refundProcessed}
                  onCheckedChange={(checked) => updateSetting('refundProcessed', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Reservation Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reservation Notifications</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleAllReservationNotifications(!settings.reservationReminders)}
              >
                {settings.reservationReminders ? 'Disable All' : 'Enable All'}
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>New Reservations</Label>
                  <p className="text-xs text-muted-foreground">Alert when new table is reserved</p>
                </div>
                <Switch
                  checked={settings.newReservation}
                  onCheckedChange={(checked) => updateSetting('newReservation', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Reservation Reminders</Label>
                  <p className="text-xs text-muted-foreground">Reminder before reservation time</p>
                </div>
                <Switch
                  checked={settings.reservationReminders}
                  onCheckedChange={(checked) => updateSetting('reservationReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Reservation Cancellations</Label>
                  <p className="text-xs text-muted-foreground">Notify when reservation is cancelled</p>
                </div>
                <Switch
                  checked={settings.reservationCancellation}
                  onCheckedChange={(checked) => updateSetting('reservationCancellation', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Reservation Modifications</Label>
                  <p className="text-xs text-muted-foreground">Alert on reservation changes</p>
                </div>
                <Switch
                  checked={settings.reservationModified}
                  onCheckedChange={(checked) => updateSetting('reservationModified', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Inventory Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inventory Notifications</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleAllInventoryNotifications(!settings.inventoryAlerts)}
              >
                {settings.inventoryAlerts ? 'Disable All' : 'Enable All'}
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Low Stock Alerts</Label>
                  <p className="text-xs text-muted-foreground">Alert when stock is below minimum threshold</p>
                </div>
                <Switch
                  checked={settings.lowStockAlert}
                  onCheckedChange={(checked) => updateSetting('lowStockAlert', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Out of Stock Alerts</Label>
                  <p className="text-xs text-muted-foreground">Immediate alert when item is out of stock</p>
                </div>
                <Switch
                  checked={settings.outOfStockAlert}
                  onCheckedChange={(checked) => updateSetting('outOfStockAlert', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Expiry Reminders</Label>
                  <p className="text-xs text-muted-foreground">Notify before items expire</p>
                </div>
                <Switch
                  checked={settings.expiryReminder}
                  onCheckedChange={(checked) => updateSetting('expiryReminder', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Staff Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Staff Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Shift Reminders</Label>
                  <p className="text-xs text-muted-foreground">Remind staff of upcoming shifts</p>
                </div>
                <Switch
                  checked={settings.shiftReminders}
                  onCheckedChange={(checked) => updateSetting('shiftReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Leave Approvals</Label>
                  <p className="text-xs text-muted-foreground">Notify about leave request status</p>
                </div>
                <Switch
                  checked={settings.leaveApproval}
                  onCheckedChange={(checked) => updateSetting('leaveApproval', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* System Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">System Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Backup Completion</Label>
                  <p className="text-xs text-muted-foreground">Notify when backup is complete</p>
                </div>
                <Switch
                  checked={settings.backupCompletion}
                  onCheckedChange={(checked) => updateSetting('backupCompletion', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-xs text-muted-foreground">Critical security notifications</p>
                </div>
                <Switch
                  checked={settings.securityAlerts}
                  onCheckedChange={(checked) => updateSetting('securityAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>System Updates</Label>
                  <p className="text-xs text-muted-foreground">Notify about system updates</p>
                </div>
                <Switch
                  checked={settings.systemUpdates}
                  onCheckedChange={(checked) => updateSetting('systemUpdates', checked)}
                />
              </div>
            </div>
          </div>

          {/* Save Button at Bottom */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} size="lg">
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
