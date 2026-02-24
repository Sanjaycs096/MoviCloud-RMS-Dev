import { LogIn, LogOut, Calendar, Clock, Menu as MenuIcon, ShoppingCart, Package, Gift, MapPin, MessageSquare, Settings, Bell } from 'lucide-react';
import type { Module, User as UserType } from '@/app/App';
import { useNotifications } from '@/context/NotificationsContext';
import { useAuthManager } from '@/utils/auth-manager';
import { useNavigate } from 'react-router-dom';

interface TopDashboardProps {
  activeModule: Module;
  isLoggedIn: boolean;
  cartItemCount: number;
  onModuleChange: (module: Module) => void;
  onLogout: () => void;
  user: UserType | null;
  showModuleNav?: boolean; // New prop to control module nav visibility
}

interface NavItem {
  id: Module;
  label: string;
  icon: React.ReactNode;
}

export default function TopDashboard({
  activeModule,
  isLoggedIn,
  cartItemCount,
  onModuleChange,
  onLogout,
  user,
  showModuleNav = true // Default to true
}: TopDashboardProps) {
  const { getUnreadCount } = useNotifications();
  const unreadCount = getUnreadCount();
  const { isAdminAuthenticated, adminUser, logoutAdmin } = useAuthManager();
  const navigate = useNavigate();

  // On landing page (/home): Login icon → Admin login (/admin)
  // On dashboard pages: Login icon → User login (/user-login)
  const handleAuthButtonClick = () => {
    if (isAdminAuthenticated) {
      logoutAdmin();
    } else if (activeModule === 'home') {
      navigate('/admin');
    } else {
      navigate('/user-login');
    }
  };

  const navItems: NavItem[] = [
    { id: 'menu', label: 'Menu', icon: <MenuIcon className="w-4 h-4" /> },
    { id: 'reservation', label: 'Reservation', icon: <Calendar className="w-4 h-4" /> },
    { id: 'queue', label: 'Queue', icon: <Clock className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
    { id: 'offers', label: 'Offers & Loyalty', icon: <Gift className="w-4 h-4" /> },
    { id: 'tracking', label: 'Order Tracking', icon: <MapPin className="w-4 h-4" /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      {/* Main Header - Always Visible */}
      <header className="bg-primary text-white">
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Restaurant Title - Left - click to go to landing */}
            <div className="flex-shrink-0">
              <h1
                className="text-3xl font-bold text-white tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                style={{ fontFamily: "'Playfair Display', serif" }}
                onClick={() => navigate('/home')}
              >
                RESTAURANT MANAGEMENT SYSTEM
              </h1>
            </div>

            {/* Right Section: Icons */}
            <div className="flex items-center gap-3 flex-shrink-0">

              {/* Cart Icon - hidden on home/landing page */}
              {activeModule !== 'home' && (
              <button
                onClick={() => isLoggedIn ? onModuleChange('cart') : navigate('/user-login')}
                className={`relative p-2.5 rounded-lg transition-all ${
                  activeModule === 'cart' ? 'bg-white text-primary' : 'text-white hover:bg-primary-foreground/10'
                }`}
                title={isLoggedIn ? 'Cart' : 'Login to view cart'}
              >
                <ShoppingCart className="w-6 h-6" />
                {isLoggedIn && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                    {cartItemCount}
                  </span>
                )}
              </button>
              )}

              {/* Notifications Icon - hidden on home/landing page */}
              {activeModule !== 'home' && (
              <button
                onClick={() => isLoggedIn ? onModuleChange('notifications') : navigate('/user-login')}
                className={`relative p-2.5 rounded-lg transition-all ${
                  activeModule === 'notifications' ? 'bg-white text-primary' : 'text-white hover:bg-primary-foreground/10'
                }`}
                title={isLoggedIn ? 'Notifications' : 'Login to view notifications'}
              >
                <Bell className="w-6 h-6" />
                {isLoggedIn && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-foreground text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-semibold border border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              )}

              {/* Profile / Login button - always visible */}
              <button
                onClick={() => isLoggedIn ? onModuleChange('profile') : handleAuthButtonClick()}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  activeModule === 'profile' ? 'bg-white text-primary' : 'text-white hover:bg-primary-foreground/10'
                }`}
                title={isLoggedIn ? (user?.name ?? 'Profile') : (activeModule === 'home' ? 'Admin Login' : 'Login / Register')}
              >
                {isLoggedIn ? (
                  /* show user avatar circle with initial */
                  <div className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                ) : isAdminAuthenticated ? (
                  <LogOut className="w-6 h-6" />
                ) : (
                  <LogIn className="w-6 h-6" />
                )}
                {!isLoggedIn && !isAdminAuthenticated && activeModule === 'home' && (
                  <span className="text-sm font-semibold tracking-wide">Admin Panel</span>
                )}
              </button>

              {/* Settings Icon - hidden on home/landing page */}
              {activeModule !== 'home' && (
              <button
                onClick={() => isLoggedIn ? onModuleChange('settings') : navigate('/user-login')}
                className={`relative p-2.5 rounded-lg transition-all ${
                  activeModule === 'settings' ? 'bg-white text-primary' : 'text-white hover:bg-primary-foreground/10'
                }`}
                title={isLoggedIn ? 'Settings' : 'Login to access settings'}
              >
                <Settings className="w-6 h-6" />
              </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Module Navigation Bar - Below Header, Shown on Dashboard pages */}
      {showModuleNav && (
        <nav className="bg-white border-b border-border">
          <div className="max-w-[1920px] mx-auto px-6">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
              {navItems.map((item) => {
                const active = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onModuleChange(item.id)}
                    className={`
                      relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap text-sm font-medium
                      ${active ? 'bg-primary text-white shadow-sm' : 'text-foreground hover:bg-secondary'}
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.id === 'cart' && cartItemCount > 0 && !active && (
                      <span className="ml-1 bg-destructive text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}