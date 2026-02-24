import { useState, useEffect } from 'react';
import { AdminDashboard } from '@/app/components/admin-dashboard';
import { MenuManagement } from '@/app/components/menu-management';
import { OrderManagement } from '@/app/components/order-management';
import { MochaKDS } from '@/app/components/mocha-kds';
import { TableManagementComprehensive } from '@/app/components/table-management-comprehensive';
import { InventoryManagement } from '@/app/components/inventory-management';
import { StaffManagement } from '@/app/components/staff-management';
import { BillingPayment } from '@/app/components/billing-payment';
import { SecuritySettings } from '@/app/components/security-settings';
import { OffersLoyalty } from '@/app/components/offers-loyalty';
import { ReportsAnalytics } from '@/app/components/reports-analytics';
import { NotificationManagement } from '@/app/components/notification-management';
import { WelcomeBanner } from '@/app/components/welcome-banner';
import { LoginPage } from '@/app/components/login-page';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Toaster } from '@/app/components/ui/sonner';
import { SystemConfigProvider, useSystemConfig } from '@/utils/system-config-context';
import { AuthProvider, useAuth, DEFAULT_TAB } from '@/utils/auth-context';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  ChefHat, 
  Users,
  Package,
  UserCog,
  Bell,
  Settings,
  User,
  Shield,
  FileText,
  Database,
  Wrench,
  LogOut,
  CreditCard,
  Tag,
  BarChart3,
  BellRing,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";

import { AdminChatBox } from '@/app/components/AdminChatBox';

function AppContent() {
  const { config, refreshConfig } = useSystemConfig();
  const { user, isAuthenticated, logout, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    // Get saved user to determine default tab
    const savedUser = localStorage.getItem('rms_current_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        return DEFAULT_TAB[userData.role as keyof typeof DEFAULT_TAB] || 'dashboard';
      } catch {
        return 'dashboard';
      }
    }
    return 'dashboard';
  });
  const [notificationCount, setNotificationCount] = useState(3); // Mock notification count
  const [triggerStockManagement, setTriggerStockManagement] = useState(false);

  // Update active tab when user changes
  useEffect(() => {
    if (user) {
      const defaultTab = DEFAULT_TAB[user.role];
      if (defaultTab && !hasPermission(activeTab)) {
        setActiveTab(defaultTab);
      }
    }
  }, [user]);

  // Listen for stock management navigation event from Kitchen
  useEffect(() => {
    const handleStockManagementRequest = () => {
      setActiveTab('inventory');
      setTriggerStockManagement(true);
      // Reset trigger after a short delay to allow re-triggering
      setTimeout(() => setTriggerStockManagement(false), 100);
    };

    const handleNewNotification = () => {
      setNotificationCount(prev => prev + 1);
    };

    window.addEventListener('navigate:stock-management' as any, handleStockManagementRequest);
    window.addEventListener('new-admin-notification' as any, handleNewNotification);
    
    return () => {
      window.removeEventListener('navigate:stock-management' as any, handleStockManagementRequest);
      window.removeEventListener('new-admin-notification' as any, handleNewNotification);
    };
  }, []);

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#000000' }}>{config.restaurantName}</h1>
                <p className="text-xs text-muted-foreground">Powered by Movicloud Labs</p>
              </div>
            </div>
            
            {/* Right side: Notifications, Settings, Profile */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" style={{ color: '#000000' }} />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {notificationCount}
                  </Badge>
                )}
              </Button>

              {/* Settings Dropdown - only show for users with settings permission */}
              {hasPermission('settings') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" style={{ color: '#000000' }} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Settings & Configuration</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Security & Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                      <Users className="mr-2 h-4 w-4" />
                      Role & Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Audit Logs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                      <Database className="mr-2 h-4 w-4" />
                      Backup & Recovery
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                      <Wrench className="mr-2 h-4 w-4" />
                    System Configuration
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              )}

              {/* Profile Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src="" alt={user?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">Role: {user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  {hasPermission('settings') && (
                    <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Preferences
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => hasPermission(value) && setActiveTab(value)} className="container mx-auto">
        <div className="sticky top-[73px] z-40">
          {/* Stylish Nav Background */}
          <div className="mx-4 my-3 rounded-2xl bg-gradient-to-r from-[#FDFBF9] via-white to-[#FDFBF9] shadow-lg border border-[#E8E0D8]">
            <TabsList className="w-full justify-center gap-1 flex-nowrap h-auto p-2 bg-transparent border-0 rounded-none overflow-x-auto">
            {hasPermission('dashboard') && (
              <TabsTrigger 
                value="dashboard" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
            )}
            {hasPermission('menu') && (
              <TabsTrigger 
                value="menu" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span className="hidden sm:inline">Menu</span>
              </TabsTrigger>
            )}
            {hasPermission('orders') && (
              <TabsTrigger 
                value="orders" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
            )}
            {hasPermission('kitchen') && (
              <TabsTrigger 
                value="kitchen" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline">Kitchen</span>
              </TabsTrigger>
            )}
            {hasPermission('tables') && (
              <TabsTrigger 
                value="tables" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Tables</span>
              </TabsTrigger>
            )}
            {hasPermission('inventory') && (
              <TabsTrigger 
                value="inventory" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Inventory</span>
              </TabsTrigger>
            )}
            {hasPermission('staff') && (
              <TabsTrigger 
                value="staff" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Staff</span>
              </TabsTrigger>
            )}
            {hasPermission('billing') && (
              <TabsTrigger 
                value="billing" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
            )}
            {hasPermission('offers') && (
              <TabsTrigger 
                value="offers" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Offers</span>
              </TabsTrigger>
            )}
            {hasPermission('reports') && (
              <TabsTrigger 
                value="reports" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
            )}
            {hasPermission('notifications') && (
              <TabsTrigger 
                value="notifications" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <BellRing className="h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
            )}
            {hasPermission('settings') && (
              <TabsTrigger 
                value="settings" 
                className="gap-2 px-4 py-2.5 rounded-xl font-medium text-[#6B5B4F] transition-all duration-300
                  hover:bg-[#F5EDE5] hover:text-[#8B5A2B]
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5A2B] data-[state=active]:to-[#A0694B]
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#8B5A2B]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            )}
          </TabsList>
          </div>
        </div>

        <div className="py-6">
          <WelcomeBanner />
        </div>

        <TabsContent value="dashboard" className="mt-0">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="menu" className="mt-0">
          <MenuManagement />
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="kitchen" className="mt-0">
          <MochaKDS />
        </TabsContent>

        <TabsContent value="tables" className="mt-0">
          <TableManagementComprehensive />
        </TabsContent>

        <TabsContent value="inventory" className="mt-0">
          <InventoryManagement triggerStockManagement={triggerStockManagement} />
        </TabsContent>

        <TabsContent value="staff" className="mt-0">
          <StaffManagement />
        </TabsContent>

        <TabsContent value="billing" className="mt-0">
          <BillingPayment />
        </TabsContent>

        <TabsContent value="offers" className="mt-0">
          <OffersLoyalty />
        </TabsContent>

        <TabsContent value="reports" className="mt-0">
          <ReportsAnalytics />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <NotificationManagement />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <SecuritySettings />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <footer className="border-t mt-12 py-8 bg-white">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">{config.restaurantName} • Movicloud Labs</p>
          <p className="text-xs text-muted-foreground mt-2"></p>
        </div>
      </footer>
      <AdminChatBox />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SystemConfigProvider>
        <AppContent />
      </SystemConfigProvider>
    </AuthProvider>
  );
}
