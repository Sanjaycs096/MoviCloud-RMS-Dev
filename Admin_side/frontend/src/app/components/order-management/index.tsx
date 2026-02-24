import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { LoadingOrders } from '@/app/components/ui/loading-spinner';
import { Clock, Package, CheckCircle, XCircle, CreditCard, Eye, IndianRupee, UtensilsCrossed, Zap, Search, Repeat, AlertCircle, TrendingUp, Activity, Timer, Undo2, Gauge, MoveRight, Ban, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentDialog } from '@/app/components/billing/payment-dialog';
import { QuickOrderPOS } from '@/app/components/quick-order-pos';
import { Order, MenuItem } from './types';
import { SMART_NOTE_KEYWORDS } from './constants';
import { 
  generateOrderDisplayId, 
  getOrderTypeBadge, 
  getOrderAge, 
  getDelayLevel, 
  getOrderPriority, 
  parseSmartNotes,
  getKitchenLoad 
} from './utils';
import { ordersApi, menuApi } from '@/utils/api';
import { useAuth } from '@/utils/auth-context';

// Animated Counter Component for count-up effect
function AnimatedCounter({ value, className = '' }: { value: number; className?: string }) {
  const spring = useSpring(0, { stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current: number) => Math.round(current));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {mounted ? display : value}
    </motion.span>
  );
}

export function OrderManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);

  const [lastAction, setLastAction] = useState<{
    orderId: string;
    previousStatus: Order['status'];
    newStatus: Order['status'];
    timestamp: number;
  } | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastAction && undoCountdown > 0) {
      undoTimerRef.current = setTimeout(() => {
        setUndoCountdown(prev => prev - 1);
      }, 1000);
    } else if (undoCountdown === 0 && lastAction) {
      setLastAction(null);
    }

    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, [undoCountdown, lastAction]);

  const fetchOrders = async () => {
    try {
      const result = await ordersApi.list();
      const rawOrders = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result as any)
          ? (result as any)
          : [];
      
      // Safely parse numeric values, using ?? to handle 0 correctly
      const safeNumber = (val: any, fallback: number = 0): number => {
        const num = Number(val);
        return isNaN(num) ? fallback : num;
      };
      
      setOrders(rawOrders.map((order: any) => {
        // Normalize items first so we can calculate total as fallback
        const normalizedItems = (order.items || []).map((item: any) => ({
          ...item,
          price: safeNumber(item.price ?? item.unitPrice ?? item.Price, 0),
          quantity: Math.max(1, safeNumber(item.quantity ?? item.qty ?? item.Qty, 1)),
          name: item.name || item.dishName || item.itemName || item.Name || 'Unknown Item'
        }));
        
        // Calculate total from items if raw total is invalid
        const rawTotal = safeNumber(order.total ?? order.totalAmount ?? order.grandTotal);
        const calculatedTotal = normalizedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const finalTotal = rawTotal > 0 ? rawTotal : calculatedTotal;
        
        return {
          ...order,
          // Map MongoDB _id to id for frontend consistency
          id: order._id || order.id,
          orderNumber: order.orderNumber || order.order_number,
          total: finalTotal,
          status: order.status || 'placed',
          type: order.type || 'dine-in',
          createdAt: order.createdAt || order.created_at || new Date().toISOString(),
          items: normalizedItems,
          waiterId: order.waiterId || order.waiter_id,
          waiterName: order.waiterName || order.waiter_name,
        };
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch orders. Please check your connection.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const result = await menuApi.list();
      const items = Array.isArray(result) ? result : (result as any)?.data || [];
      setMenuItems(items.filter((item: MenuItem) => item.available !== false));
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status'], skipUndo: boolean = false) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (!skipUndo && order.status !== newStatus) {
        setLastAction({
          orderId,
          previousStatus: order.status,
          newStatus,
          timestamp: Date.now()
        });
        setUndoCountdown(10);
      }

      // Use real API - clean the order ID to get raw MongoDB ID
      const cleanId = orderId.replace('order:', '').replace(/^.*:/, '');
      await ordersApi.updateStatus(cleanId, newStatus);
      const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      toast.success(`Order marked as ${statusText}!`);
      
      if (newStatus === 'served' && order.type === 'dine-in' && order.tableNumber) {
        window.dispatchEvent(new CustomEvent('order:served', {
          detail: {
            orderId: orderId,
            tableNumber: order.tableNumber,
            orderType: order.type
          }
        }));
      }
      
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // Use real API
      const cleanId = orderId.replace('order:', '');
      await ordersApi.delete(cleanId);
      toast.success('Order deleted successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const undoLastAction = async () => {
    if (!lastAction) return;

    try {
      await updateOrderStatus(lastAction.orderId, lastAction.previousStatus, true);
      setLastAction(null);
      setUndoCountdown(0);
      toast.success('Action undone successfully!');
    } catch (error) {
      console.error('Error undoing action:', error);
      toast.error('Failed to undo action');
    }
  };

  const duplicateOrder = (order: Order) => {
    toast.info('Duplicate order feature coming soon!');
    setQuickOrderOpen(true);
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return <Clock className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'ready':
      case 'served':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return 'bg-sky-50 text-sky-500 border-sky-100';
      case 'preparing':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'ready':
        return 'bg-stone-100 text-stone-600 border-stone-200';
      case 'served':
      case 'completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-100';
    }
  };

  // Filter and search orders - waiters only see their own orders
  const filteredOrders = orders.filter(order => {
    // For waiters, filter to show only their orders
    if (user?.role === 'waiter') {
      const waiterId = user.id;
      // Show orders assigned to this waiter or orders for tables assigned to this waiter
      const isWaiterOrder = order.waiterId === waiterId || order.waiterName === user.name;
      if (!isWaiterOrder) return false;
    }
    
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (filterType !== 'all' && order.type !== filterType) return false;
    if (filterTable !== 'all' && order.tableNumber?.toString() !== filterTable) return false;
    if (searchQuery && !generateOrderDisplayId(order.id, order.orderNumber).toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sort orders: NEWEST FIRST, then by bottleneck/delay
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aAge = getOrderAge(a);
    const bAge = getOrderAge(b);
    const aDelay = getDelayLevel(aAge, a.status);
    const bDelay = getDelayLevel(bAge, b.status);

    if (aDelay === 'bottleneck' && bDelay !== 'bottleneck') return -1;
    if (bDelay === 'bottleneck' && aDelay !== 'bottleneck') return 1;
    
    if (aDelay === 'critical' && bDelay !== 'critical') return -1;
    if (bDelay === 'critical' && aDelay !== 'critical') return 1;
    
    if (aDelay === 'warning' && bDelay !== 'warning') return -1;
    if (bDelay === 'warning' && aDelay !== 'warning') return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeOrders = orders.filter(o => !['served', 'completed', 'cancelled'].includes(o.status)).length;
  const servedToday = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return o.status === 'served' && 
           orderDate.getDate() === today.getDate() &&
           orderDate.getMonth() === today.getMonth() &&
           orderDate.getFullYear() === today.getFullYear();
  }).length;
  
  const preparingOrders = orders.filter(o => o.status === 'preparing' || o.status === 'ready');
  const avgPrepTime = preparingOrders.length > 0
    ? Math.floor(preparingOrders.reduce((sum, o) => sum + getOrderAge(o), 0) / preparingOrders.length)
    : 0;

  const kitchenLoad = getKitchenLoad(activeOrders);
  const tableNumbers = Array.from(new Set(orders.map(o => o.tableNumber).filter(Boolean)));

  if (loading) {
    return <LoadingOrders />;
  }

  return (
    <div className="p-6 space-y-6" style={{ background: 'linear-gradient(135deg, #FDFCFB 0%, #F7F3EE 100%)' }}>
      <style>{`
        /* Attractive Premium Styling */
        .premium-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(139, 90, 43, 0.08), 0 1px 4px rgba(139, 90, 43, 0.06);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(139, 90, 43, 0.08);
        }
        
        .premium-card:hover {
          box-shadow: 0 12px 40px rgba(139, 90, 43, 0.15), 0 4px 12px rgba(139, 90, 43, 0.10);
          transform: translateY(-8px) scale(1.01);
          border: 1px solid rgba(139, 90, 43, 0.15);
        }
        
        /* Attractive Order Card */
        .order-card-white {
          background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
          border-radius: 20px;
          box-shadow: 
            0 8px 32px rgba(139, 90, 43, 0.12),
            0 2px 8px rgba(139, 90, 43, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background-clip: padding-box;
          position: relative;
        }
        
        .order-card-white::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 18px;
          padding: 2px;
          background: linear-gradient(135deg, rgba(139, 90, 43, 0.15), rgba(139, 90, 43, 0.05));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .order-card-white:hover {
          box-shadow: 
            0 16px 56px rgba(139, 90, 43, 0.18),
            0 4px 16px rgba(139, 90, 43, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          transform: translateY(-12px) scale(1.02);
        }
        
        .order-card-white:hover::before {
          opacity: 1;
        }
        
        /* Glossy Effect */
        .glossy {
          position: relative;
          overflow: hidden;
        }
        
        .glossy::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          transform: rotate(45deg);
          animation: shine 3s infinite;
        }
        
        @keyframes shine {
          0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .glow-border {
          position: relative;
        }
        
        .status-pulse {
          animation: gentle-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes gentle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        
        .btn-ripple {
          position: relative;
          overflow: hidden;
        }
        
        .btn-ripple::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .btn-ripple:active::before {
          width: 300px;
          height: 300px;
        }
        
        .icon-bounce:hover {
          animation: playful-bounce 0.6s ease;
        }
        
        @keyframes playful-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-5px) rotate(5deg) scale(1.1); }
          50% { transform: translateY(0) rotate(0deg) scale(1); }
          75% { transform: translateY(-3px) rotate(-5deg) scale(1.05); }
        }
        
        .icon-glow {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .icon-glow:hover {
          filter: drop-shadow(0 0 8px currentColor);
          transform: scale(1.2);
        }
        
        .progress-fill {
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .timeline-active {
          animation: timeline-pulse 1.8s ease-in-out infinite;
        }
        
        @keyframes timeline-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        
        /* Gradient Text */
        .gradient-text {
          background: linear-gradient(135deg, #8B5A2B 0%, #A67C52 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Floating Animation */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .floating {
          animation: float 3s ease-in-out infinite;
        }
        
        * {
          scroll-behavior: smooth;
        }
        
        /* Badge Glow */
        .badge-glow {
          box-shadow: 0 0 12px currentColor;
        }
      `}</style>

      {/* Header with Sparkle */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text flex items-center gap-2">
            Orders
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-7 w-7 text-[#8B5A2B]" />
            </motion.div>
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track all orders in real-time</p>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={() => setQuickOrderOpen(true)}
            className="gap-2 shadow-md btn-ripple bg-gradient-to-r from-[#8B5A2B] to-[#A67C52] hover:from-[#7a4e24] hover:to-[#8B5A2B] border-0"
          >
            <Zap className="h-4 w-4" />
            Quick Order
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid gap-6 md:grid-cols-3"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="floating"
        >
          <Card className="premium-card glossy border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                <AnimatedCounter value={activeOrders} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="floating"
          style={{ animationDelay: '0.3s' }}
        >
          <Card className="premium-card glossy border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                Avg Prep Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                <AnimatedCounter value={avgPrepTime} /> <span className="text-lg">min</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="floating"
          style={{ animationDelay: '0.6s' }}
        >
          <Card className="premium-card glossy border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Served Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                <AnimatedCounter value={servedToday} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Kitchen Load */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className={`premium-card glossy border-2 ${
          kitchenLoad.level === 'high' ? 'border-red-300 bg-red-50' :
          kitchenLoad.level === 'medium' ? 'border-orange-300 bg-orange-50' :
          'border-green-300 bg-green-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="icon-glow"
                >
                  <Gauge className={`h-8 w-8 ${kitchenLoad.color}`} />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Kitchen Load Status</p>
                  <p className={`text-2xl font-bold ${kitchenLoad.color}`}>
                    {kitchenLoad.label} - {activeOrders} Orders
                  </p>
                </div>
              </div>
              <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  className={`h-full progress-fill ${
                    kitchenLoad.level === 'high' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    kitchenLoad.level === 'medium' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${kitchenLoad.percentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="premium-card glossy">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-2 focus:border-[#8B5A2B]"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="border-2 focus:border-[#8B5A2B]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="placed">Placed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-2 focus:border-[#8B5A2B]">
                  <SelectValue placeholder="Order Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dine-in">Dine-In</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger className="border-2 focus:border-[#8B5A2B]">
                  <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {tableNumbers.map(table => (
                    <SelectItem key={table} value={table!.toString()}>
                      Table {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterType('all');
                    setFilterTable('all');
                    setSearchQuery('');
                  }}
                  className="w-full border-2 hover:border-[#8B5A2B] hover:bg-[#8B5A2B] hover:text-white btn-ripple"
                >
                  Clear Filters
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Undo Toast */}
      <AnimatePresence>
        {lastAction && undoCountdown > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            <Card className="premium-card glossy border-2 border-yellow-400 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">
                        Status changed to <strong>{lastAction.newStatus}</strong>
                      </p>
                      <p className="text-xs text-yellow-700">
                        Undo in {undoCountdown} second{undoCountdown !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      onClick={undoLastAction}
                      className="gap-2 bg-yellow-600 hover:bg-yellow-700 btn-ripple"
                    >
                      <Undo2 className="h-4 w-4" />
                      Undo
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders Grid */}
      {sortedOrders.length === 0 ? (
        <Card className="premium-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
            </motion.div>
            <p className="text-lg text-muted-foreground">No orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedOrders.map((order, index) => {
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const ageInMinutes = getOrderAge(order);
            const delayLevel = getDelayLevel(ageInMinutes, order.status);
            const priority = getOrderPriority(order);
            const smartNotes = parseSmartNotes(order.notes);
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className={`order-card-white ${
                    delayLevel === 'bottleneck' ? 'ring-4 ring-red-300 shadow-red-200' :
                    delayLevel === 'critical' ? 'ring-4 ring-red-200' :
                    delayLevel === 'warning' ? 'ring-4 ring-yellow-200' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl font-bold gradient-text">
                            {generateOrderDisplayId(order.id, order.orderNumber)}
                          </CardTitle>
                          {!['served', 'completed', 'cancelled'].includes(order.status) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            >
                              <Badge className={`${priority.color} status-pulse text-xs px-2 py-1`}>
                                {priority.badge}
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs border-[#8B5A2B]/30 text-[#8B5A2B]">
                            {getOrderTypeBadge(order.type)}
                          </Badge>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Badge className={`${getStatusColor(order.status)} status-pulse border-2`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </motion.div>
                          {order.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottleneck Alert */}
                    {delayLevel === 'bottleneck' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 p-3 bg-red-50 border-2 border-red-300 rounded-xl"
                      >
                        <div className="flex items-center gap-2 text-red-700">
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <AlertCircle className="h-5 w-5" />
                          </motion.div>
                          <p className="text-sm font-bold">⚠️ Kitchen Bottleneck - Priority!</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Smart Notes */}
                    {smartNotes && smartNotes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {smartNotes.map((note, idx) => {
                          const keyword = SMART_NOTE_KEYWORDS[note.keyword as keyof typeof SMART_NOTE_KEYWORDS];
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.1, type: "spring" }}
                              whileHover={{ scale: 1.15, rotate: 5 }}
                            >
                              <Badge 
                                className={`text-xs ${keyword.bg} ${keyword.color} border-0 px-3 py-1`}
                              >
                                <span className="mr-1 text-base">{keyword.icon}</span>
                                {note.text}
                              </Badge>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t-2 border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <motion.div 
                          className={`flex flex-col items-center gap-1 ${
                            order.status === 'placed' ? 'text-blue-600 font-bold scale-110' : 'text-gray-400'
                          }`}
                          animate={order.status === 'placed' ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Clock className="h-4 w-4" />
                          <span>Placed</span>
                        </motion.div>
                        <div className={`flex-1 h-1 mx-2 rounded-full ${
                          ['placed', 'preparing', 'ready', 'served', 'completed'].includes(order.status) 
                            ? 'bg-gradient-to-r from-blue-500 to-orange-500' 
                            : 'bg-gray-200'
                        }`} />
                        <motion.div 
                          className={`flex flex-col items-center gap-1 ${
                            order.status === 'preparing' ? 'text-orange-600 font-bold scale-110' : 
                            ['ready', 'served', 'completed'].includes(order.status) ? 'text-gray-500' : 'text-gray-300'
                          }`}
                          animate={order.status === 'preparing' ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Package className="h-4 w-4" />
                          <span>Cooking</span>
                        </motion.div>
                        <div className={`flex-1 h-1 mx-2 rounded-full ${
                          ['ready', 'served', 'completed'].includes(order.status) 
                            ? 'bg-gradient-to-r from-orange-500 to-purple-500' 
                            : 'bg-gray-200'
                        }`} />
                        <motion.div 
                          className={`flex flex-col items-center gap-1 ${
                            order.status === 'ready' ? 'text-purple-600 font-bold scale-110' : 
                            ['served', 'completed'].includes(order.status) ? 'text-gray-500' : 'text-gray-300'
                          }`}
                          animate={order.status === 'ready' ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>Ready</span>
                        </motion.div>
                        <div className={`flex-1 h-1 mx-2 rounded-full ${
                          ['served', 'completed'].includes(order.status) 
                            ? 'bg-gradient-to-r from-purple-500 to-green-500' 
                            : 'bg-gray-200'
                        }`} />
                        <motion.div 
                          className={`flex flex-col items-center gap-1 ${
                            ['served', 'completed'].includes(order.status) ? 'text-green-600 font-bold scale-110' : 'text-gray-300'
                          }`}
                          animate={['served', 'completed'].includes(order.status) ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Served</span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Aging Indicator */}
                    {!['served', 'completed', 'cancelled'].includes(order.status) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`mt-3 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                          delayLevel === 'critical' ? 'bg-red-100 text-red-700 border-2 border-red-300' :
                          delayLevel === 'warning' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' :
                          delayLevel === 'bottleneck' ? 'bg-red-200 text-red-800 border-2 border-red-400' :
                          'bg-blue-50 text-blue-700 border-2 border-blue-200'
                        }`}
                      >
                        <motion.div
                          animate={delayLevel ? { rotate: 360 } : {}}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Timer className="h-5 w-5" />
                        </motion.div>
                        <span>⏱ Waiting {ageInMinutes} min{ageInMinutes !== 1 ? 's' : ''}</span>
                        {delayLevel && (
                          <motion.div
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="ml-auto"
                          >
                            <AlertCircle className="h-5 w-5" />
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                    
                    {/* Table Info */}
                    <div className="text-sm space-y-1 mt-3">
                      {order.type === 'dine-in' && order.tableNumber && (
                        <div className="flex items-center gap-2 text-[#8B5A2B] font-semibold">
                          <UtensilsCrossed className="h-4 w-4" />
                          <span>Table {order.tableNumber}</span>
                        </div>
                      )}
                      {order.customerName && (
                        <div className="font-semibold text-gray-700">
                          👤 {order.customerName}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200">
                      <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                        Order Items ({totalItems})
                      </p>
                      <ul className="text-sm space-y-2">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item: any, idx) => {
                            const itemName = item.name || item.dishName || item.itemName || `Item ${idx + 1}`;
                            return (
                            <motion.li 
                              key={idx} 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm"
                            >
                              <span className="font-medium text-gray-700">
                                <span className="text-[#8B5A2B] font-bold">{item.quantity || 0}x</span> {itemName}
                              </span>
                              <span className="flex items-center gap-0.5 font-bold text-[#8B5A2B]">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                              </span>
                            </motion.li>
                          );
                          })
                        ) : (
                          <li className="text-gray-500">No items found</li>
                        )}</ul>
                    </div>

                    {/* Total */}
                    <div className="pt-3 border-t-2 border-gray-200 space-y-3">
                      <div className="flex justify-between items-center bg-gradient-to-r from-[#8B5A2B] to-[#A67C52] p-4 rounded-xl text-white">
                        <span className="text-sm font-bold uppercase tracking-wide">Total</span>
                        <span className="text-2xl font-bold flex items-center gap-1">
                          <IndianRupee className="h-5 w-5" />
                          {order.total.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-600 px-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        {order.paymentMethod && (
                          <span className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 rounded-full">
                            <CreditCard className="h-3 w-3" />
                            {order.paymentMethod.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2">
                      {order.status === 'placed' && (
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="w-full gap-2 btn-ripple bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 shadow-lg border-0"
                          >
                            <MoveRight className="h-4 w-4" />
                            Accept Order
                          </Button>
                        </motion.div>
                      )}
                      {order.status === 'preparing' && (
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="w-full gap-2 btn-ripple bg-gradient-to-r from-[#C4A484] to-[#B08968] hover:from-[#B08968] hover:to-[#9C7B5E] shadow-lg border-0"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark as Ready
                          </Button>
                        </motion.div>
                      )}
                      {order.status === 'ready' && (
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'served')}
                            className="w-full gap-2 btn-ripple bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 shadow-lg border-0"
                          >
                            <UtensilsCrossed className="h-4 w-4" />
                            Mark as Served
                          </Button>
                        </motion.div>
                      )}
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <motion.div 
                              className="flex-1"
                              whileHover={{ scale: 1.03 }} 
                              whileTap={{ scale: 0.97 }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full gap-1.5 btn-ripple border-2 border-[#8B5A2B]/30 hover:bg-[#8B5A2B] hover:text-white"
                              >
                                <Eye className="h-4 w-4" />
                                Details
                              </Button>
                            </motion.div>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="gradient-text text-xl">Order {generateOrderDisplayId(order.id, order.orderNumber)}</DialogTitle>
                              <DialogDescription>Complete order information</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="bg-[#F7F3EE] p-3 rounded-lg">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">ORDER TYPE</p>
                                <p className="text-sm font-medium">{getOrderTypeBadge(order.type)}</p>
                              </div>
                              {order.tableNumber && (
                                <div className="bg-[#F7F3EE] p-3 rounded-lg">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">TABLE NUMBER</p>
                                  <p className="text-sm font-medium">Table {order.tableNumber}</p>
                                </div>
                              )}
                              {order.customerName && (
                                <div className="bg-[#F7F3EE] p-3 rounded-lg">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">CUSTOMER NAME</p>
                                  <p className="text-sm font-medium">{order.customerName}</p>
                                </div>
                              )}
                              {order.notes && (
                                <div className="bg-[#F7F3EE] p-3 rounded-lg">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">NOTES</p>
                                  <p className="text-sm font-medium">{order.notes}</p>
                                </div>
                              )}
                              <div className="bg-[#F7F3EE] p-3 rounded-lg">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">STATUS</p>
                                <Badge className="bg-blue-100 text-blue-700">
                                  {getStatusIcon(order.status)}
                                  <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                                </Badge>
                              </div>
                              <div className="bg-[#F7F3EE] p-3 rounded-lg">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">ORDER ITEMS</p>
                                <ul className="space-y-2">
                                  {order.items.map((item: any, idx) => {
                                    const itemName = item.name || item.dishName || item.itemName || `Item ${idx + 1}`;
                                    return (
                                    <li key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                                      <span className="font-medium">{item.quantity || 0}x {itemName}</span>
                                      <span className="flex items-center gap-0.5 font-semibold">
                                        <IndianRupee className="h-3 w-3" />
                                        {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                      </span>
                                    </li>
                                  )})}
                                </ul>
                              </div>
                              <div className="bg-[#8B5A2B] text-white p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-semibold">TOTAL AMOUNT</span>
                                  <span className="text-xl font-bold flex items-center gap-0.5">
                                    <IndianRupee className="h-5 w-5" />
                                    {order.total.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 bg-[#F7F3EE] px-3 py-2 rounded-lg flex-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{new Date(order.createdAt).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}</span>
                                </div>
                                {order.paymentMethod && (
                                  <div className="flex items-center gap-1 bg-[#F7F3EE] px-3 py-2 rounded-lg">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    <span className="font-medium">{order.paymentMethod.toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {['served', 'completed'].includes(order.status) && (
                          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => duplicateOrder(order)}
                              className="btn-ripple border-2 border-gray-300 hover:border-[#8B5A2B]"
                            >
                              <Repeat className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        )}
                        
                        {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'served' && (
                          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-2 border-red-300 text-red-600 hover:bg-red-50 btn-ripple"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <QuickOrderPOS
        open={quickOrderOpen}
        onOpenChange={setQuickOrderOpen}
        onOrderCreated={fetchOrders}
      />

      {selectedOrder && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={selectedOrder.id}
          amount={selectedOrder.total}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}